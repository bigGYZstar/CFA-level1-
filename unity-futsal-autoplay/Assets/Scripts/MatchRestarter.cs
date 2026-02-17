// ============================================================
// MatchRestarter.cs
// Attach to: the "GameManager" GameObject.
// After match ends, waits a few seconds then restarts.
// ============================================================
using UnityEngine;

public class MatchRestarter : MonoBehaviour
{
    [Header("Settings")]
    public float restartDelay = 4f;   // seconds after final whistle

    bool waiting;
    float timer;

    void Update()
    {
        if (GameManager.I == null) return;
        if (!GameManager.I.matchOver) { waiting = false; return; }

        if (!waiting)
        {
            waiting = true;
            timer = restartDelay;
        }

        timer -= Time.deltaTime;
        if (timer <= 0f)
        {
            waiting = false;
            GameManager.I.ResetMatch();
        }
    }
}
