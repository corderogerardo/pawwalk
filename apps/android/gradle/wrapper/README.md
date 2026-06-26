# Gradle wrapper

`gradle-wrapper.jar` is a small binary that isn't checked in here. It is created
automatically when you **open this project in Android Studio** (the IDE runs a
Gradle sync that generates it), or you can create it from the command line:

```bash
gradle wrapper --gradle-version 8.13
```

After that, `./gradlew assembleDebug` works.
