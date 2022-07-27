# CandyBot
A Halloween Trick-or-Treat no-contact "Claw Game" 
that trick-or-treaters control through arm-motions to grab the candy, 
made from LEGO Mindstorms EV3 and some custom code.

## Architecture

1. BrickPi3 (EV3 hat on Raspberry Pi 3)
2. Running EV3Dev (Debian)
3. Running Kotlin
4. Serving HTTPS, WebSockets, and REST via KTor
5. Serves up static HTML+JavaScript
6. Serving a single-page site
7. To a smartphone
8. Which uses the phone's camera
9. To run TFJS pose-estimation (in browser)
10. When a kid does the right arm-poses (TBD)
11. The signal to move the motor is sent back to the web server
12. Converted to Motor Control signals
13. Which moves the robot, lowers the claw, grabs, candy, and delivers it to their waiting outstretched hands!
