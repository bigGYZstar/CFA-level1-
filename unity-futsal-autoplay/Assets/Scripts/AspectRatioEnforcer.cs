// ============================================================
// AspectRatioEnforcer.cs
// Attach to: Main Camera (or let CourtSetup handle it).
// Ensures the full court is always visible on any aspect ratio
// (especially tall iPhone screens in landscape).
// ============================================================
using UnityEngine;

[RequireComponent(typeof(Camera))]
public class AspectRatioEnforcer : MonoBehaviour
{
    Camera cam;

    void Start()
    {
        cam = GetComponent<Camera>();
        Adjust();
    }

    void Update()
    {
        // Re-adjust if resolution changes (e.g., rotation)
        Adjust();
    }

    void Adjust()
    {
        if (GameManager.I == null) return;

        float courtW = GameManager.I.courtHalfW * 2f + 2f; // padding
        float courtH = GameManager.I.courtHalfH * 2f + 3f; // padding for HUD

        float screenAspect = (float)Screen.width / Screen.height;
        float courtAspect  = courtW / courtH;

        if (screenAspect < courtAspect)
        {
            // Screen is taller than court → fit width
            cam.orthographicSize = (courtW / screenAspect) / 2f;
        }
        else
        {
            // Screen is wider → fit height
            cam.orthographicSize = courtH / 2f;
        }
    }
}
