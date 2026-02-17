// ============================================================
// BallController.cs
// Attach to: a small circle sprite GameObject named "Ball"
// Handles ball movement, possession, trajectory trails.
// ============================================================
using UnityEngine;
using System.Collections.Generic;

public class BallController : MonoBehaviour
{
    // ── Tunable Parameters ──────────────────────────────────
    [Header("Ball Speeds")]
    public float passSpeed      = 12f;
    public float shotSpeed      = 18f;
    public float looseBallDrag  = 3f;    // deceleration when free

    [Header("Trajectory Visuals")]
    public float trailDuration  = 0.3f;  // how long dotted/thick line shows
    public Color passTrailColor = new Color(1f, 1f, 1f, 0.5f);
    public Color shotTrailColor = new Color(1f, 0.3f, 0.1f, 0.7f);

    // ── Runtime State ───────────────────────────────────────
    [HideInInspector] public PlayerController possessor;
    [HideInInspector] public bool isFree;       // moving freely (pass/shot/loose)
    [HideInInspector] public bool isShot;

    Vector2 velocity;
    float trailTimer;
    Vector2 trailStart, trailEnd;
    bool showingTrail;
    bool trailIsShot;

    LineRenderer lr;
    SpriteRenderer sr;

    void Awake()
    {
        sr = GetComponent<SpriteRenderer>();
        if (sr == null) sr = gameObject.AddComponent<SpriteRenderer>();

        // Line renderer for trajectory
        lr = gameObject.AddComponent<LineRenderer>();
        lr.startWidth = 0.05f;
        lr.endWidth   = 0.05f;
        lr.positionCount = 0;
        lr.material = new Material(Shader.Find("Sprites/Default"));
        lr.sortingOrder = 5;
        lr.useWorldSpace = true;
    }

    void Update()
    {
        var gm = GameManager.I;
        if (gm.matchOver || gm.resetting) return;

        if (possessor != null && !isFree)
        {
            // Stick to possessor with small offset toward their facing
            Vector2 offset = possessor.FacingDir * 0.25f;
            transform.position = (Vector2)possessor.transform.position + offset;
        }
        else if (isFree)
        {
            // Move ball
            Vector2 pos = transform.position;
            pos += velocity * Time.deltaTime;

            // Bounce off top/bottom walls
            if (Mathf.Abs(pos.y) > gm.courtHalfH)
            {
                pos.y = Mathf.Clamp(pos.y, -gm.courtHalfH, gm.courtHalfH);
                velocity.y = -velocity.y * 0.5f;
            }

            // Check goal or side-wall bounce
            int goalSide = gm.CheckGoal(pos);
            if (goalSide != 0)
            {
                transform.position = pos;
                gm.GoalScored(goalSide);
                return;
            }

            // Side walls (but not goal mouth area)
            if (Mathf.Abs(pos.x) > gm.courtHalfW)
            {
                pos.x = Mathf.Clamp(pos.x, -gm.courtHalfW, gm.courtHalfW);
                velocity.x = -velocity.x * 0.5f;
            }

            transform.position = pos;

            // Drag
            velocity = Vector2.MoveTowards(velocity, Vector2.zero,
                                            looseBallDrag * Time.deltaTime);
            if (velocity.magnitude < 0.3f)
            {
                velocity = Vector2.zero;
                isShot = false;
            }
        }

        // Trail fade
        if (showingTrail)
        {
            trailTimer -= Time.deltaTime;
            if (trailTimer <= 0f)
            {
                showingTrail = false;
                lr.positionCount = 0;
            }
            else
            {
                float alpha = trailTimer / trailDuration;
                Color c = trailIsShot ? shotTrailColor : passTrailColor;
                c.a *= alpha;
                lr.startColor = c;
                lr.endColor   = c;
                lr.startWidth = trailIsShot ? 0.12f : 0.05f;
                lr.endWidth   = trailIsShot ? 0.12f : 0.05f;

                // For pass trail, make it dashed via positions
                if (!trailIsShot)
                    SetDashedLine(trailStart, trailEnd, c);
                else
                    SetSolidLine(trailStart, trailEnd);
            }
        }
    }

    // ── Public API ──────────────────────────────────────────

    public void GiveTo(PlayerController player)
    {
        possessor = player;
        isFree = false;
        isShot = false;
        velocity = Vector2.zero;
    }

    public void Kick(Vector2 direction, float speed, bool shot, Vector2 targetPos)
    {
        trailStart = transform.position;
        trailEnd   = targetPos;
        trailIsShot = shot;
        showingTrail = true;
        trailTimer = trailDuration;

        if (shot)
            SetSolidLine(trailStart, trailEnd);
        else
            SetDashedLine(trailStart, trailEnd, passTrailColor);

        possessor = null;
        isFree = true;
        isShot = shot;
        velocity = direction.normalized * speed;
    }

    public void ResetBall(Vector2 pos)
    {
        transform.position = pos;
        velocity = Vector2.zero;
        possessor = null;
        isFree = false;
        isShot = false;
        showingTrail = false;
        lr.positionCount = 0;
    }

    public void PickUp(PlayerController player)
    {
        possessor = player;
        isFree = false;
        isShot = false;
        velocity = Vector2.zero;
    }

    // ── Trail Drawing Helpers ───────────────────────────────

    void SetSolidLine(Vector2 a, Vector2 b)
    {
        lr.positionCount = 2;
        lr.SetPosition(0, new Vector3(a.x, a.y, 0));
        lr.SetPosition(1, new Vector3(b.x, b.y, 0));
    }

    void SetDashedLine(Vector2 a, Vector2 b, Color c)
    {
        float dist = Vector2.Distance(a, b);
        int segments = Mathf.Max(2, (int)(dist / 0.4f));
        List<Vector3> pts = new List<Vector3>();
        for (int i = 0; i < segments; i++)
        {
            float t0 = (float)i / segments;
            float t1 = t0 + 0.5f / segments;
            Vector2 p0 = Vector2.Lerp(a, b, t0);
            Vector2 p1 = Vector2.Lerp(a, b, Mathf.Min(t1, 1f));
            pts.Add(new Vector3(p0.x, p0.y, 0));
            pts.Add(new Vector3(p1.x, p1.y, 0));
            // gap: skip next half-segment
        }
        lr.positionCount = pts.Count;
        lr.SetPositions(pts.ToArray());
    }
}
