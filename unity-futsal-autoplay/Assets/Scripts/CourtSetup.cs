// ============================================================
// CourtSetup.cs
// Attach to: the same "GameManager" GameObject (or any GO).
// Procedurally builds the entire scene at runtime so you
// only need ONE scene with ONE empty GameObject to start.
// ============================================================
using UnityEngine;
using TMPro;

public class CourtSetup : MonoBehaviour
{
    [Header("Visual Settings")]
    public Color courtColor      = new Color(0.15f, 0.55f, 0.15f, 1f);   // green
    public Color lineColor       = new Color(1f, 1f, 1f, 0.8f);
    public Color teamAColor      = new Color(0.2f, 0.5f, 1f, 1f);        // blue
    public Color teamBColor      = new Color(1f, 0.3f, 0.2f, 1f);        // red
    public Color ballColor       = Color.white;
    public Color numberColor     = Color.white;
    public float playerRadius    = 0.35f;
    public float ballRadius      = 0.15f;

    // 5v5 formation: offsets from the CENTRE of the pitch.
    // Team A (left, side=-1) uses these as-is.
    // Team B (right, side=+1) mirrors X (and optionally Y).
    //
    // Index 0 = GK, 1-2 = defenders, 3 = midfielder, 4 = forward
    static readonly Vector2[] formationLocal = new Vector2[]
    {
        new Vector2(-7.2f,  0.0f),   // GK  (near own goal)
        new Vector2(-5.0f, -1.8f),   // DEF left
        new Vector2(-5.0f,  1.8f),   // DEF right
        new Vector2(-2.0f,  0.0f),   // MID centre
        new Vector2(-0.5f,  0.0f),   // FWD (near centre)
    };

    static readonly int[] shirtNumbers = { 1, 2, 3, 5, 9 };

    void Awake()
    {
        var gm = GetComponent<GameManager>();
        if (gm == null) gm = gameObject.AddComponent<GameManager>();

        float hw = gm.courtHalfW;
        float hh = gm.courtHalfH;
        float gh = gm.goalHalfH;
        float gd = gm.goalDepth;

        // ── Camera ──────────────────────────────────────────
        Camera cam = Camera.main;
        if (cam == null)
        {
            var camGO = new GameObject("MainCamera");
            cam = camGO.AddComponent<Camera>();
            camGO.tag = "MainCamera";
        }
        cam.orthographic = true;
        cam.orthographicSize = hh + 1.5f;
        cam.transform.position = new Vector3(0, 0, -10);
        cam.backgroundColor = new Color(0.08f, 0.08f, 0.12f);
        cam.gameObject.AddComponent<AspectRatioEnforcer>();

        // ── Court Background ────────────────────────────────
        CreateQuad("Court", Vector2.zero, hw * 2f, hh * 2f, courtColor, -1);

        // ── Court Lines ─────────────────────────────────────
        float lw = 0.06f;
        // Outline
        DrawLine("LineTop",    new Vector2(0, hh),  hw * 2f, lw, lineColor);
        DrawLine("LineBot",    new Vector2(0, -hh), hw * 2f, lw, lineColor);
        DrawLine("LineLeft",   new Vector2(-hw, 0), lw, hh * 2f, lineColor);
        DrawLine("LineRight",  new Vector2(hw, 0),  lw, hh * 2f, lineColor);
        // Centre line
        DrawLine("CentreLine", Vector2.zero, lw, hh * 2f, lineColor);
        // Centre circle
        DrawCircleLine("CentreCircle", Vector2.zero, 1.5f, lineColor, lw);
        // Centre dot
        CreateCircle("CentreDot", Vector2.zero, 0.08f, lineColor, 1);

        // ── Penalty Areas ───────────────────────────────────
        float paW = 2.0f; float paH = 2.5f;
        DrawRect("PALeft",  new Vector2(-hw + paW / 2f, 0), paW, paH * 2f, lineColor, lw);
        DrawRect("PARight", new Vector2( hw - paW / 2f, 0), paW, paH * 2f, lineColor, lw);

        // ── Goals (nets) ────────────────────────────────────
        Color goalNetColor = new Color(0.9f, 0.9f, 0.9f, 0.25f);
        CreateQuad("GoalLeft",  new Vector2(-hw - gd / 2f, 0), gd, gh * 2f, goalNetColor, 0);
        CreateQuad("GoalRight", new Vector2( hw + gd / 2f, 0), gd, gh * 2f, goalNetColor, 0);
        // Goal posts
        Color postColor = Color.white;
        CreateCircle("PostLT", new Vector2(-hw, gh),  0.08f, postColor, 2);
        CreateCircle("PostLB", new Vector2(-hw, -gh), 0.08f, postColor, 2);
        CreateCircle("PostRT", new Vector2(hw, gh),   0.08f, postColor, 2);
        CreateCircle("PostRB", new Vector2(hw, -gh),  0.08f, postColor, 2);

        // ── Ball ────────────────────────────────────────────
        GameObject ballGO = CreateCircle("Ball", Vector2.zero, ballRadius, ballColor, 4);
        var bc = ballGO.AddComponent<BallController>();
        gm.ball = bc;

        // ── Players ─────────────────────────────────────────
        for (int t = 0; t < 2; t++)
        {
            int side = (t == 0) ? -1 : 1;       // -1 = left (A), +1 = right (B)
            Color col = (t == 0) ? teamAColor : teamBColor;

            for (int i = 0; i < 5; i++)
            {
                // Mirror formation for right team
                Vector2 fpos = formationLocal[i];
                if (side == 1)
                {
                    fpos.x = -fpos.x;   // mirror X
                    fpos.y = -fpos.y;   // mirror Y so shape is symmetric
                }

                string pName = $"Player_{(side < 0 ? "A" : "B")}{i}";
                GameObject pGO = CreateCircle(pName, fpos, playerRadius, col, 2);

                // Number label
                var labelGO = new GameObject("Number");
                labelGO.transform.SetParent(pGO.transform, false);
                var tm = labelGO.AddComponent<TextMeshPro>();
                tm.text = shirtNumbers[i].ToString();
                tm.fontSize = 2.5f;
                tm.alignment = TextAlignmentOptions.Center;
                tm.color = numberColor;
                tm.sortingOrder = 3;
                labelGO.transform.localPosition = new Vector3(0, -0.05f, 0);
                labelGO.transform.localScale = Vector3.one * 0.8f;
                var rectT = tm.GetComponent<RectTransform>();
                rectT.sizeDelta = new Vector2(1f, 1f);

                var pc = pGO.AddComponent<PlayerController>();
                pc.teamSide = side;
                pc.playerNumber = shirtNumbers[i];
                pc.formationPos = fpos;
            }
        }

        // ── HUD Text ────────────────────────────────────────
        // Score
        GameObject scoreTGO = new GameObject("ScoreText");
        var scoreTMP = scoreTGO.AddComponent<TextMeshPro>();
        scoreTMP.text = "0 - 0";
        scoreTMP.fontSize = 4f;
        scoreTMP.alignment = TextAlignmentOptions.Center;
        scoreTMP.color = Color.white;
        scoreTMP.sortingOrder = 10;
        scoreTGO.transform.position = new Vector3(0, hh + 0.8f, 0);
        var scoreRect = scoreTMP.GetComponent<RectTransform>();
        scoreRect.sizeDelta = new Vector2(6f, 1.2f);
        gm.scoreText = scoreTMP;

        // Time
        GameObject timeTGO = new GameObject("TimeText");
        var timeTMP = timeTGO.AddComponent<TextMeshPro>();
        timeTMP.text = "01:30";
        timeTMP.fontSize = 3f;
        timeTMP.alignment = TextAlignmentOptions.Center;
        timeTMP.color = new Color(1f, 1f, 1f, 0.7f);
        timeTMP.sortingOrder = 10;
        timeTGO.transform.position = new Vector3(0, hh + 0.25f, 0);
        var timeRect = timeTMP.GetComponent<RectTransform>();
        timeRect.sizeDelta = new Vector2(4f, 0.8f);
        gm.timeText = timeTMP;
    }

    // ── Primitive Helpers ───────────────────────────────────

    GameObject CreateQuad(string name, Vector2 pos, float w, float h, Color col, int order)
    {
        var go = new GameObject(name);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = MakeSquareSprite();
        sr.color = col;
        sr.sortingOrder = order;
        go.transform.position = new Vector3(pos.x, pos.y, 0);
        go.transform.localScale = new Vector3(w, h, 1);
        return go;
    }

    GameObject CreateCircle(string name, Vector2 pos, float radius, Color col, int order)
    {
        var go = new GameObject(name);
        var sr = go.AddComponent<SpriteRenderer>();
        sr.sprite = MakeCircleSprite();
        sr.color = col;
        sr.sortingOrder = order;
        go.transform.position = new Vector3(pos.x, pos.y, 0);
        go.transform.localScale = Vector3.one * radius * 2f;
        return go;
    }

    void DrawLine(string name, Vector2 centre, float w, float h, Color col)
    {
        CreateQuad(name, centre, w, h, col, 0);
    }

    void DrawRect(string name, Vector2 centre, float w, float h, Color col, float lw)
    {
        CreateQuad(name + "T", centre + new Vector2(0, h / 2f),  w, lw, col, 0);
        CreateQuad(name + "B", centre + new Vector2(0, -h / 2f), w, lw, col, 0);
        CreateQuad(name + "L", centre + new Vector2(-w / 2f, 0), lw, h, col, 0);
        CreateQuad(name + "R", centre + new Vector2(w / 2f, 0),  lw, h, col, 0);
    }

    void DrawCircleLine(string name, Vector2 centre, float radius, Color col, float width)
    {
        var go = new GameObject(name);
        var lr = go.AddComponent<LineRenderer>();
        lr.material = new Material(Shader.Find("Sprites/Default"));
        lr.startColor = col; lr.endColor = col;
        lr.startWidth = width; lr.endWidth = width;
        lr.useWorldSpace = true;
        lr.sortingOrder = 0;
        int seg = 48;
        lr.positionCount = seg + 1;
        for (int i = 0; i <= seg; i++)
        {
            float a = (float)i / seg * Mathf.PI * 2f;
            lr.SetPosition(i, new Vector3(centre.x + Mathf.Cos(a) * radius,
                                          centre.y + Mathf.Sin(a) * radius, 0));
        }
    }

    // ── Sprite Generation ───────────────────────────────────

    static Sprite _sqSprite;
    static Sprite MakeSquareSprite()
    {
        if (_sqSprite != null) return _sqSprite;
        Texture2D tex = new Texture2D(4, 4);
        for (int y = 0; y < 4; y++)
        for (int x = 0; x < 4; x++)
            tex.SetPixel(x, y, Color.white);
        tex.Apply();
        _sqSprite = Sprite.Create(tex, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4);
        return _sqSprite;
    }

    static Sprite _circSprite;
    static Sprite MakeCircleSprite()
    {
        if (_circSprite != null) return _circSprite;
        int size = 64;
        Texture2D tex = new Texture2D(size, size, TextureFormat.RGBA32, false);
        float centre = size / 2f;
        float r = size / 2f - 1f;
        Color clear = new Color(0, 0, 0, 0);
        for (int y = 0; y < size; y++)
        for (int x = 0; x < size; x++)
        {
            float d = Mathf.Sqrt((x - centre) * (x - centre) + (y - centre) * (y - centre));
            tex.SetPixel(x, y, d <= r ? Color.white : clear);
        }
        tex.Apply();
        _circSprite = Sprite.Create(tex, new Rect(0, 0, size, size),
                                    new Vector2(0.5f, 0.5f), size);
        return _circSprite;
    }
}
