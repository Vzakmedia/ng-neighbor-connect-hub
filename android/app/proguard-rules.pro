# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Capacitor specific rules
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }

# Firebase rules
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable

# WebView JS interface (uncomment if needed)
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}
