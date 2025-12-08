# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

### Running the Application
This is a static web application. You can run it by:

1. **Opening directly**: Open `index.html` in your web browser.
2. **Local Server (Node.js)**:
   ```bash
   npx serve .
   ```
3. **Local Server (Python)**:
   ```bash
   python -m http.server
   ```

### Testing
There are currently no automated tests. Testing involves manually running the CPT test in the browser.

## Architecture and Structure

### Overview
This is a standalone, client-side Continuous Performance Test (CPT) application built with vanilla HTML, CSS, and JavaScript. It is designed to measure sustained attention and impulsivity.

### Core Components
- **`index.html`**: The entry point. Contains the UI structure including the start screen, test area (stimulus display), and results summary.
- **`script.js`**: Contains the application logic.
  - Manages the test state (`isTestRunning`, `hits`, `misses`, etc.).
  - `runTrial()`: Core loop that displays stimuli (letters) at fixed intervals.
  - `handleResponse()`: Processes user input (Spacebar) to record reaction times and accuracy.
  - Configuration constants (e.g., `TEST_DURATION_MS`, `TARGET_LETTER`) are defined at the top of the file.
- **`style.css`**: Handles the visual layout, centering the test area, and managing visibility states (e.g., `.hidden` class).

### Data Flow
1. User clicks "Start Test".
2. `startTest()` initializes counters and starts the `runTrial()` loop.
3. `runTrial()` picks a random letter (target 'X' or distractor) and displays it.
4. User input is captured via a global `keydown` listener.
5. After `TEST_DURATION_MS`, `endTest()` stops the loop and calculates statistics (Hits, Omission Errors, Commission Errors, Avg RT).
