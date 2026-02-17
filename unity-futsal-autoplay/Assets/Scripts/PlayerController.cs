// ============================================================
// PlayerController.cs
// Attach to: each player circle GameObject (10 total)
// AI decision loop: DRIBBLE / PASS / SHOT every decisionInterval.
// ============================================================
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    // ── Tunable Parameters (shared defaults, override per-player if you like)
    [Header("Movement")]
    public float moveSpeed       = 4.0f;
    public float dribbleSpeed    = 3.2f;

    [Header("Accuracy & Control  (0–1)")]
    public float passAccuracy    = 0.85f;   // 1 = perfect
    public float shotAccuracy    = 0.70f;
    public float dribbleControl  = 0.90f;   // chance to keep ball each tick

    [Header("Interception")]
    public float interceptRadius = 0.7f;    // auto-pickup radius for loose ball

    [Header("Decision")]
    public float decisionInterval = 0.20f;  // seconds between AI ticks

    [Header("Shot / Pass Zones")]
    public float shotRange       = 4.0f;    // max distance to attempt shot
    public float shotAngle       = 40f;     // half-angle cone toward goal (degrees)

    // ── Identity (set in Inspector or by Spawner) ───────────
    [Header("Team")]
    public int teamSide;          // -1 = left (Team A), +1 = right (Team B)
    public int playerNumber = 1;  // shirt number shown on circle
    public Vector2 formationPos;  // home position for reset

    // ── Runtime ─────────────────────────────────────────────
    [HideInInspector] public Vector2 FacingDir = Vector2.right;

    float decisionTimer;
    SpriteRenderer sr;
    SpriteRenderer ringRenderer;   // possession ring child
    TextMesh numberLabel;

    BallController ball;
    GameManager gm;

    // ── Lifecycle ───────────────────────────────────────────

    void Start()
    {
        gm   = GameManager.I;
        ball = gm.ball;
        sr   = GetComponent<SpriteRenderer>();

        // Create possession ring child
        var ringGO = new GameObject("Ring");
        ringGO.transform.SetParent(transform, false);
        ringRenderer = ringGO.AddComponent<SpriteRenderer>();
        ringRenderer.sprite = MakeRingSprite();
        ringRenderer.color  = (teamSide < 0) ? new Color(0.2f,0.6f,1f,0.6f)
                                              : new Color(1f,0.3f,0.2f,0.6f);
        ringRenderer.sortingOrder = 3;
        ringGO.transform.localScale = Vector3.one * 1.6f;
        ringRenderer.enabled = false;

        decisionTimer = Random.Range(0f, decisionInterval); // stagger
    }

    void Update()
    {
        if (gm.matchOver || gm.resetting) return;

        bool hasBall = (ball.possessor == this);
        ringRenderer.enabled = hasBall;

        // ── Interception: pick up loose ball ────────────────
        if (!hasBall && ball.isFree)
        {
            float d = Vector2.Distance(transform.position, ball.transform.position);
            if (d < interceptRadius)
            {
                // Don't let the same team re-intercept their own pass instantly
                ball.PickUp(this);
                hasBall = true;
            }
        }

        // ── AI Decision Tick ────────────────────────────────
        decisionTimer -= Time.deltaTime;
        if (decisionTimer <= 0f)
        {
            decisionTimer = decisionInterval;
            if (hasBall)
                DecideWithBall();
            else
                DecideWithoutBall();
        }

        // ── Continuous movement toward current target ───────
        MoveTowardTarget();
    }

    // ── AI: With Ball ───────────────────────────────────────

    Vector2 moveTarget;
    enum Action { Idle, Dribble, MoveTo }
    Action currentAction = Action.Idle;

    void DecideWithBall()
    {
        Vector2 goalCenter = new Vector2(-teamSide * gm.courtHalfW, 0f); // opponent goal

        float distToGoal = Vector2.Distance(transform.position, goalCenter);
        Vector2 toGoal = (goalCenter - (Vector2)transform.position).normalized;
        float angleToGoal = Vector2.Angle(FacingDir, toGoal);

        // 1) SHOT — close enough & reasonable angle
        if (distToGoal < shotRange && angleToGoal < shotAngle)
        {
            DoShot(goalCenter);
            return;
        }

        // 2) PASS — find most open teammate
        PlayerController bestTarget = FindBestPassTarget();
        if (bestTarget != null)
        {
            float passDist = Vector2.Distance(transform.position, bestTarget.transform.position);
            // Only pass if teammate is reasonably far (avoid silly short passes)
            if (passDist > 1.5f)
            {
                DoPass(bestTarget);
                return;
            }
        }

        // 3) DRIBBLE — move toward open space / goal direction
        DoDribble();
    }

    void DoShot(Vector2 goalCenter)
    {
        // Add some inaccuracy
        float err = (1f - shotAccuracy) * 2f;
        Vector2 target = goalCenter + new Vector2(0, Random.Range(-err, err));
        Vector2 dir = (target - (Vector2)transform.position).normalized;
        FacingDir = dir;
        ball.Kick(dir, ball.shotSpeed, true, target);
    }

    void DoPass(PlayerController target)
    {
        Vector2 targetPos = target.transform.position;
        // Lead the pass slightly
        targetPos += (Vector2)(target.moveTarget - (Vector2)target.transform.position).normalized * 0.3f;
        // Inaccuracy
        float err = (1f - passAccuracy) * 1.5f;
        targetPos += new Vector2(Random.Range(-err, err), Random.Range(-err, err));

        Vector2 dir = (targetPos - (Vector2)transform.position).normalized;
        FacingDir = dir;
        ball.Kick(dir, ball.passSpeed, false, targetPos);
    }

    void DoDribble()
    {
        // Dribble control check — small chance to lose ball
        if (Random.value > dribbleControl)
        {
            // Fumble: ball goes loose in a random direction
            Vector2 fumbleDir = Random.insideUnitCircle.normalized;
            ball.Kick(fumbleDir, 3f, false, (Vector2)transform.position + fumbleDir * 2f);
            return;
        }

        // Move toward opponent goal but steer away from nearest opponent
        Vector2 goalDir = new Vector2(-teamSide, 0).normalized;
        Vector2 avoidDir = Vector2.zero;

        var players = FindObjectsOfType<PlayerController>();
        float closestOpp = float.MaxValue;
        foreach (var p in players)
        {
            if (p.teamSide == teamSide || p == this) continue;
            float d = Vector2.Distance(transform.position, p.transform.position);
            if (d < closestOpp && d < 3f)
            {
                closestOpp = d;
                avoidDir = ((Vector2)transform.position - (Vector2)p.transform.position).normalized;
            }
        }

        Vector2 desired = (goalDir * 0.7f + avoidDir * 0.3f).normalized;
        moveTarget = (Vector2)transform.position + desired * 2f;
        moveTarget = gm.ClampToCourt(moveTarget);
        currentAction = Action.Dribble;
        FacingDir = desired;
    }

    // ── AI: Without Ball ────────────────────────────────────

    void DecideWithoutBall()
    {
        // If ball is loose and close, chase it
        if (ball.isFree)
        {
            float d = Vector2.Distance(transform.position, ball.transform.position);
            if (d < 5f)
            {
                moveTarget = ball.transform.position;
                currentAction = Action.MoveTo;
                return;
            }
        }

        // Otherwise drift toward formation position with some offset toward ball
        Vector2 ballPos = ball.transform.position;
        Vector2 home = formationPos;

        // Shift formation toward ball's Y and slightly toward ball's X
        float xShift = Mathf.Clamp((ballPos.x - home.x) * 0.25f, -2f, 2f);
        float yShift = Mathf.Clamp((ballPos.y - home.y) * 0.35f, -1.5f, 1.5f);
        Vector2 target = home + new Vector2(xShift, yShift);
        target = gm.ClampToCourt(target);

        moveTarget = target;
        currentAction = Action.MoveTo;
    }

    // ── Find Best Pass Target ───────────────────────────────

    PlayerController FindBestPassTarget()
    {
        var players = FindObjectsOfType<PlayerController>();
        PlayerController best = null;
        float bestScore = float.MinValue;

        foreach (var p in players)
        {
            if (p.teamSide != teamSide || p == this) continue;

            Vector2 toTeammate = (Vector2)p.transform.position - (Vector2)transform.position;
            float dist = toTeammate.magnitude;
            if (dist < 1f || dist > 14f) continue;

            // "Openness" = how far from nearest opponent
            float openness = GetOpenness(p);

            // Prefer teammates closer to opponent goal
            float goalProgress = -teamSide * p.transform.position.x; // higher = closer to opp goal

            float score = openness * 2f + goalProgress * 0.5f - dist * 0.1f;

            // Penalty if pass lane is blocked
            if (IsPassLaneBlocked(transform.position, p.transform.position))
                score -= 5f;

            if (score > bestScore)
            {
                bestScore = score;
                best = p;
            }
        }
        return best;
    }

    float GetOpenness(PlayerController teammate)
    {
        float minDist = float.MaxValue;
        var players = FindObjectsOfType<PlayerController>();
        foreach (var p in players)
        {
            if (p.teamSide == teamSide) continue;
            float d = Vector2.Distance(teammate.transform.position, p.transform.position);
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    bool IsPassLaneBlocked(Vector2 from, Vector2 to)
    {
        Vector2 dir = (to - from).normalized;
        float dist = Vector2.Distance(from, to);
        var players = FindObjectsOfType<PlayerController>();
        foreach (var p in players)
        {
            if (p.teamSide == teamSide) continue;
            Vector2 toP = (Vector2)p.transform.position - from;
            float proj = Vector2.Dot(toP, dir);
            if (proj < 0.5f || proj > dist - 0.5f) continue;
            Vector2 closest = from + dir * proj;
            float perpDist = Vector2.Distance(closest, p.transform.position);
            if (perpDist < 0.8f) return true;
        }
        return false;
    }

    // ── Movement ────────────────────────────────────────────

    void MoveTowardTarget()
    {
        if (currentAction == Action.Idle) return;

        float speed = (currentAction == Action.Dribble) ? dribbleSpeed : moveSpeed;
        Vector2 pos = transform.position;
        Vector2 dir = (moveTarget - pos);

        if (dir.magnitude < 0.1f)
        {
            currentAction = Action.Idle;
            return;
        }

        FacingDir = dir.normalized;
        pos = Vector2.MoveTowards(pos, moveTarget, speed * Time.deltaTime);
        pos = gm.ClampToCourt(pos);
        transform.position = new Vector3(pos.x, pos.y, 0);
    }

    // ── Formation Reset ─────────────────────────────────────

    public void ResetToFormation()
    {
        transform.position = new Vector3(formationPos.x, formationPos.y, 0);
        currentAction = Action.Idle;
        moveTarget = formationPos;
        FacingDir = new Vector2(-teamSide, 0);
    }

    // ── Utility: Make a ring sprite at runtime ──────────────

    static Sprite cachedRing;
    static Sprite MakeRingSprite()
    {
        if (cachedRing != null) return cachedRing;
        int size = 64;
        Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Color clear = new Color(0, 0, 0, 0);
        float center = size / 2f;
        float outerR = size / 2f - 1f;
        float innerR = outerR - 3f;
        for (int y = 0; y < size; y++)
        for (int x = 0; x < size; x++)
        {
            float d = Mathf.Sqrt((x - center) * (x - center) + (y - center) * (y - center));
            tex.SetPixel(x, y, (d >= innerR && d <= outerR) ? Color.white : clear);
        }
        tex.Apply();
        cachedRing = Sprite.Create(tex, new Rect(0, 0, size, size),
                                   new Vector2(0.5f, 0.5f), size);
        return cachedRing;
    }
}
