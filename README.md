# CandyBot

A Halloween Trick-or-Treat no-contact "Claw Game"
that trick-or-treating kids control through arm-motions to grab the candy,
made from LEGO Mindstorms EV3 and some custom code.

## Architecture Stack

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

## Localhost SSL

`keytool -keystore keystore.jks -alias ev3dev -genkeypair -keyalg RSA -keysize 4096 -validity 90 -dname 'CN=ev3dev, OU=ktor, O=ktor, L=Unspecified, ST=Unspecified, C=US'`

## Resources

* https://blog.tensorflow.org/2018/05/real-time-human-pose-estimation-in.html
* https://blog.tensorflow.org/2021/11/3D-handpose.html
* https://blog.tensorflow.org/2022/01/body-segmentation.html
* https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/blazepose_mediapipe
* https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/int8/4
* https://tfhub.dev/google/movenet/singlepose/lightning/4

## TODO

- [x] Long duration test
- [ ] Wire it up
- [ ] Projector
- [ ] Motor timing and speed
- [ ] Emergency Override UI
- [ ] https://christianheilmann.com/2013/07/19/flipping-the-image-when-accessing-the-laptop-camera-with-getusermedia/