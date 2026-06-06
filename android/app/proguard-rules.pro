# ─── Capacitor core ───────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class * extends org.apache.cordova.CordovaPlugin { *; }

# ─── Cordova CallKit ──────────────────────────────────────────────────────────
-keep class com.dmarc.cordovacall.** { *; }

# ─── Capgo: Updater & Native Audio ───────────────────────────────────────────
-keep class ee.forgr.capacitor_updater.** { *; }
-keep class ee.forgr.audio.** { *; }

# ─── Aparajita Biometric Auth ─────────────────────────────────────────────────
-keep class com.aparajita.capacitor.biometricauth.** { *; }

# ─── Capacitor community: Contacts ───────────────────────────────────────────
-keep class com.capacitorjs.plugins.contacts.** { *; }

# ─── Background Runner ────────────────────────────────────────────────────────
-keep class com.capacitorjs.plugins.backgroundrunner.** { *; }
-keep class com.capacitorjs.android.backgroundrunner.** { *; }

# ─── Google Maps ──────────────────────────────────────────────────────────────
-keep class com.capacitorjs.plugins.googlemaps.** { *; }
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.maps.android.** { *; }

# ─── Firebase ─────────────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ─── LiveKit / WebRTC ─────────────────────────────────────────────────────────
-keep class io.livekit.** { *; }
-keep class livekit.** { *; }
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**
-dontwarn io.livekit.**

# ─── OkHttp / Ktor (used by Supabase SDK) ────────────────────────────────────
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# ─── WebView JS bridge ────────────────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class androidx.webkit.** { *; }

# ─── Kotlin & coroutines ──────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.coroutines.**

# ─── Serialization ────────────────────────────────────────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keep class kotlinx.serialization.** { *; }
-dontwarn kotlinx.serialization.**

# ─── Enum safety ──────────────────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ─── Parcelable ───────────────────────────────────────────────────────────────
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# ─── Debug symbols ────────────────────────────────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
