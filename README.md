# NeuroServo Horizon Cloud Application
The NeuroServo Horizon cloud application.

## Overview
This cloud application was designed to compliment NeuroServo's VEEGix8 device and VEEGix8 iPad app with the goal
being to to allow neurologists to access a recording session as the VEEGix8 device and VEEGix8 iPad app is
recording a patient's EEG reading & video of the patient.

This cloud application allows neurologists to remotely monitor patients by providing a *live-feed* of patients'
EEG readings and videos as it occurs.

This is accomplished by the VEEGix8 iPad app continuously uploading the patient's EEG readings as well as
streaming a video-feed to a cloud infrastructure.
  _The cloud infrastructure for this prototype & initial release(s) is provided by *Amazon's AWS services*._

Additionally, this cloud application allows neurologists to review a recorded session afterwards.

## Features

Allows neurologists to:
- Remotely monitor patients in which VEEGix8 iPad app is providing a *live-feed* of that recording session.
- Review previously recorded sessions. Those recorded sessions could be:
  - A *live-feed* that was previously recorded by the VEEGix8 iPad app that occurred at an earlier point-in-time.
  - One that was recorded by the VEEGix8 iPad app onto the iPad device & then uploaded to the cloud infrastructure.