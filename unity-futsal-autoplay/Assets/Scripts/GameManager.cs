// ============================================================
// GameManager.cs
// Attach to: an empty GameObject named "GameManager"
// Controls match flow: timer, score, kick-off, goal reset.
// ============================================================
using UnityEngine;
using TMPro;

public class GameManager : MonoBehaviour
{
    // ── Tunable Parameters ──────────────────────────────────
    [Header("Match Settings")]
    public float matchDuration = 90f;          // seconds
    public float goalResetDelay = 1.5f;        // pause after goal

    // ── Court Dimensions (world units, landscape) ───────────
    [Header("Court Bounds (half-sizes)")]
    public float courtHalfW = 8.0f;            // half-width  (X)
    public float courtHalfH = 5.0f;            // half-height (Y)
    public float goalHalfH  = 1.5f;            // goal mouth half-height
    public float goalDepth  = 0.4f;            // goal net depth behind line

    // ── References (auto-found if left null) ────────────────
    [Header("References")]
    public BallController ball;
    public TextMeshPro scoreText;
    public TextMeshPro timeText;

    // ── Runtime State ───────────────────────────────────────
    [HideInInspector] public int scoreLeft;     // Team A (left)
    [HideInInspector] public int scoreRight;    // Team B (right)
    [HideInInspector] public float elapsed;
    [HideInInspector] public bool matchOver;
    [HideInInspector] public bool resetting;    // true during goal-reset pause

    // Kick-off direction: +1 = right team kicks, -1 = left team kicks
    [HideInInspector] public int kickOffSide = 1;

    // ── Singleton-like accessor ─────────────────────────────
    public static GameManager I { get; private set; }

    void Awake()
    {
        I = this;
        Application.targetFrameRate = 60;
    }

    void Start()
    {
        if (ball == null) ball = FindObjectOfType<BallController>();
        if (scoreText == null)
        {
            var go = GameObject.Find("ScoreText");
            if (go) scoreText = go.GetComponent<TextMeshPro>();
        }
        if (timeText == null)
        {
            var go = GameObject.Find("TimeText");
            if (go) timeText = go.GetComponent<TextMeshPro>();
        }
        ResetMatch();
    }

    void Update()
    {
        if (matchOver || resetting) return;

        elapsed += Time.deltaTime;
        if (elapsed >= matchDuration)
        {
            matchOver = true;
            UpdateHUD();
            return;
        }
        UpdateHUD();
    }

    // ── HUD ─────────────────────────────────────────────────
    void UpdateHUD()
    {
        if (scoreText)
            scoreText.text = $"{scoreLeft} - {scoreRight}";

        if (timeText)
        {
            float remaining = Mathf.Max(0f, matchDuration - elapsed);
            int min = (int)(remaining / 60f);
            int sec = (int)(remaining % 60f);
            timeText.text = $"{min:00}:{sec:00}";
        }
    }

    // ── Goal Scored ─────────────────────────────────────────
    public void GoalScored(int side) // +1 = scored on right goal, -1 = scored on left goal
    {
        if (matchOver || resetting) return;
        if (side > 0) scoreLeft++;
        else          scoreRight++;

        kickOffSide = -side;   // conceding team kicks off
        resetting = true;
        UpdateHUD();
        Invoke(nameof(DoKickOff), goalResetDelay);
    }

    // ── Kick-Off / Reset ────────────────────────────────────
    public void ResetMatch()
    {
        scoreLeft = 0;
        scoreRight = 0;
        elapsed = 0f;
        matchOver = false;
        kickOffSide = 1;
        DoKickOff();
    }

    void DoKickOff()
    {
        resetting = false;
        // Reset ball
        ball.ResetBall(Vector2.zero);

        // Reset all players to formation
        var players = FindObjectsOfType<PlayerController>();
        foreach (var p in players)
            p.ResetToFormation();

        // Give ball to the kick-off team's center player
        PlayerController kicker = null;
        float bestDist = float.MaxValue;
        foreach (var p in players)
        {
            if (p.teamSide != kickOffSide) continue;
            float d = Vector2.Distance(p.transform.position, Vector2.zero);
            if (d < bestDist) { bestDist = d; kicker = p; }
        }
        if (kicker != null)
            ball.GiveTo(kicker);
    }

    // ── Helpers ─────────────────────────────────────────────
    public bool IsInsideCourt(Vector2 pos)
    {
        return Mathf.Abs(pos.x) <= courtHalfW && Mathf.Abs(pos.y) <= courtHalfH;
    }

    public Vector2 ClampToCourt(Vector2 pos)
    {
        pos.x = Mathf.Clamp(pos.x, -courtHalfW, courtHalfW);
        pos.y = Mathf.Clamp(pos.y, -courtHalfH, courtHalfH);
        return pos;
    }

    /// <summary>Is this position inside one of the goal mouths?</summary>
    public int CheckGoal(Vector2 pos)
    {
        // Right goal (Team A scores)
        if (pos.x >= courtHalfW - 0.05f && Mathf.Abs(pos.y) <= goalHalfH)
            return +1;
        // Left goal (Team B scores)
        if (pos.x <= -courtHalfW + 0.05f && Mathf.Abs(pos.y) <= goalHalfH)
            return -1;
        return 0;
    }
}
