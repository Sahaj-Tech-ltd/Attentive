# Open CPT Testing

Open CPT Testing is a web-based, open-source Continuous Performance Test (CPT) application designed to assist in the assessment of Attention Deficit Disorder (ADD) and Attention Deficit Hyperactivity Disorder (ADHD). 

This tool implements a standard "No-Go" paradigm to measure sustained attention (vigilance) and impulsivity (response inhibition).

## Clinical Context & Usage

A Continuous Performance Test (CPT) is a neuropsychological test that measures a person's sustained and selective attention.

**Core Paradigm:**
- **Go / No-Go Task**: The user is presented with a stream of letters.
- **Target (Go)**: Press the SPACEBAR for any letter *except* 'X'.
- **Non-Target (No-Go)**: Do *not* press anything when the letter 'X' appears.

**Measured Domains:**
1.  **Sustained Attention (Inattention)**: Measured by **Omission Errors** (failure to press Space on non-X letters) and reaction time variability.
2.  **Impulsivity (Disinhibition)**: Measured by **Commission Errors** (incorrectly pressing Space on 'X').
3.  **Vigilance**: The test uses variable inter-stimulus intervals (ISI) and block speeds (Slow vs. Fast) to tax the attention system over time.

**Key Features for Assessment:**
- **Variable Loading**: Alternates between "Slow" (low cognitive load, inducing boredom) and "Fast" (high cognitive load, inducing errors) blocks.
- **Double-X Trigger**: In fast blocks, an 'X' may be immediately followed by another 'X' to test recovery and perseveration.
- **Reaction Time Statistics**: Calculates Mean Reaction Time (RT) and Standard Deviation of RT (SDRT) to assess consistency.

*Disclaimer: This software is for educational and research purposes. It is not a certified medical device and should not be used as the sole basis for a clinical diagnosis.*

## Running the Application

This is a client-side application that runs directly in your web browser.

### Option 1: Direct Open
Simply open the `index.html` file in any modern web browser (Chrome, Firefox, Edge, Safari).

### Option 2: Local Server (Recommended)
For the best experience, run it via a local server:

**Using Python:**
```bash
python -m http.server
```
Then navigate to `http://localhost:8000`.

**Using Node.js:**
```bash
npx serve .
```

## Configuration & Settings

Click the **Settings** button on the start screen to customize:
- **Total Trials**: Default is 300.
- **Target %**: Percentage of trials that are 'X' (No-Go).
- **Durations**: Stimulus exposure time for Slow (default 700ms) and Fast (default 300ms) blocks.
- **ISI**: Inter-Stimulus Interval (blank screen duration).
- **Double X Probability**: Chance of a second 'X' appearing immediately after a first 'X'.

## Privacy & Data
All data is stored locally in your browser using **IndexedDB**. No data is sent to any external server.

## License
Licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
