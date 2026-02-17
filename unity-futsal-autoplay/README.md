# Unity 2D Futsal Autoplay Mockup

This project provides a complete, runnable Unity 2022+ C# solution for a non-interactive 5v5 futsal match simulation. The entire scene is procedurally generated from a single empty GameObject, making setup incredibly simple.

## Features

- **Autoplay AI**: Players make their own decisions using a simple priority-based logic loop (Shoot > Pass > Dribble).
- **Procedural Scene**: The entire court, players, ball, and UI are created at runtime. No manual scene setup is needed.
- **Core Mechanics**: Clear visual depiction of dribbling (ball sticks to player with a ring), passing (dotted line trajectory), and shooting (thicker line trajectory).
- **Simple Physics**: Basic collision with court boundaries and goal detection.
- **Game Flow**: Handles kick-offs, goal resets, a match timer, and automatic match restart.
- **iPhone Friendly**: An aspect ratio enforcer ensures the entire court is visible on various screen sizes (tested for landscape mode).
- **Highly Tunable**: Key gameplay parameters are exposed in the Inspector for easy tweaking.

## Prerequisites

- **Unity 2022.3 LTS** or newer.
- **TextMeshPro**: The TextMeshPro package must be installed in your Unity project (usually included by default). Go to `Window > TextMeshPro > Import TMP Essential Resources` if you haven't already.

## Quick Setup Instructions

Because the project is entirely procedural, you can get it running in under a minute.

1.  **Create a New Project**: Open Unity Hub and create a new **2D (Core)** project.
2.  **Import Scripts**: Copy all the C# script files from the `Assets/Scripts` directory of this repository into your new project's `Assets/Scripts` folder.
3.  **Create GameManager**: 
    - In a new, empty scene, create an empty GameObject.
    - Name it `GameManager`.
4.  **Attach Scripts**: 
    - Select the `GameManager` GameObject.
    - Drag and drop the following three (3) scripts onto it in the Inspector:
        - `GameManager.cs`
        - `CourtSetup.cs`
        - `MatchRestarter.cs`
5.  **Run the Scene**: Press the **Play** button in the Unity Editor. The entire futsal match will generate and start playing automatically.

That's it! There are no other sprites, prefabs, or scene objects to configure.

## Script Overview

All scripts are located in the `Assets/Scripts` folder.

| File Name                 | Attached To         | Description                                                                                                                               |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GameManager.cs`          | `GameManager` (GO)  | The central controller. Manages the match timer, score, game state (playing, goal reset, game over), and defines court/goal boundaries.       |
| `CourtSetup.cs`           | `GameManager` (GO)  | **Procedurally builds the entire scene at `Awake()`**. It creates the court, lines, goals, players, ball, and HUD text from code.             |
| `MatchRestarter.cs`       | `GameManager` (GO)  | A simple utility that automatically restarts the match a few seconds after it ends.                                                       |
| `PlayerController.cs`     | (Added by `CourtSetup`) | The AI brain for each player. Handles the decision-making loop, movement, interception, and defines all player-specific tunable parameters. |
| `BallController.cs`       | (Added by `CourtSetup`) | Manages the ball's state, including possession, free movement (pass/shot), collision, and drawing the pass/shot trajectory lines.      |
| `AspectRatioEnforcer.cs`  | (Added by `CourtSetup`) | Attached to the Main Camera to ensure the game view fits different screen aspect ratios, preventing the court from being cut off.        |

## Tunable Parameters

To tweak the simulation's behavior, select the `GameManager` GameObject in the scene and look at the Inspector. You will find parameters on the `GameManager` and `PlayerController` components.

### GameManager Parameters

- **Match Duration**: Total length of one match in seconds.
- **Goal Reset Delay**: Pause duration (in seconds) after a goal is scored before the next kick-off.
- **Court/Goal Bounds**: Defines the size of the playing field and goals in world units.

### PlayerController Parameters (Default)

*Note: These are attached to the `PlayerController` script, but since players are generated at runtime, you can modify the default values in the `PlayerController.cs` script's public fields before running the scene for global changes.*

- **Move Speed**: Player speed when not dribbling.
- **Dribble Speed**: Player speed when in possession of the ball.
- **Pass Accuracy**: `1.0` is a perfect pass, `0.0` is highly inaccurate. Controls the random deviation from the target.
- **Shot Accuracy**: `1.0` is a perfect shot at the goal center, `0.0` is highly inaccurate.
- **Dribble Control**: Chance (`0.0` to `1.0`) to successfully keep the ball on each AI decision tick while dribbling. A lower value leads to more fumbles.
- **Intercept Radius**: The distance within which a player can automatically take possession of a loose ball.
- **Decision Interval**: The time in seconds between each AI player's decision (shoot, pass, or dribble).
- **Shot Range / Angle**: Defines the zone from which a player will consider shooting. They must be within this distance and angle to the opponent's goal.
