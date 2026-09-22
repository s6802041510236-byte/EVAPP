export default {
  expo: {
    name: "EVChargingMap",
    slug: "evmap",
    owner: "nuttanon",
    version: "1.0.0",
    orientation: "portrait",

    icon: "./assets/images/icon.png",

    scheme: "evchargingmap",

    userInterfaceStyle: "automatic",

    ios: {
      icon: "./assets/expo.icon",

      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "แอปต้องการใช้ตำแหน่งของคุณเพื่อค้นหาสถานีชาร์จ EV และนำทางไปยังสถานี",
      },
    },

    android: {
      package: "com.nuttanon.evchargingmap",

      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],

      adaptiveIcon: {
        backgroundColor: "#E6F4FE",

        foregroundImage:
          "./assets/images/android-icon-foreground.png",

        backgroundImage:
          "./assets/images/android-icon-background.png",

        monochromeImage:
          "./assets/images/android-icon-monochrome.png",
      },

      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "single",

      favicon:
        "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",

      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          image:
            "./assets/images/splash-icon.png",
          imageWidth: 76,
        },
      ],

      "expo-location",
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      eas: {
        projectId:
          "f568b4f2-1431-4386-ac6d-44b7246b4eff",
      },
    },
  },
};