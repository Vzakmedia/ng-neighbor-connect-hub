package com.neighborlink.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PictureInPictureParams;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.view.View;
import androidx.activity.EdgeToEdge;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {

  // Set to true from JavaScript (via plugin or evaluateJavascript) when a call/video is active
  public boolean isPipEligible = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
    FirebaseApp.initializeApp(this);
    createNotificationChannels();

    // Handle window insets so the WebView content respects system bars
    View rootView = findViewById(android.R.id.content);
    ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, windowInsets) -> {
      Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
      v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
      return WindowInsetsCompat.CONSUMED;
    });

    // Configure PiP params upfront for API 26+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
          .setAspectRatio(new Rational(9, 16));
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        builder.setAutoEnterEnabled(true);
      }
      setPictureInPictureParams(builder.build());
    }
  }

  /** Creates all notification channels required by the app (Android 8+). */
  private void createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;

    // --- Incoming calls (maximum priority — shows full-screen on lock screen) ---
    Uri callRingtone = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
    AudioAttributes callAudioAttrs = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build();
    NotificationChannel callChannel = new NotificationChannel(
        "incoming_calls",
        "Incoming Calls",
        NotificationManager.IMPORTANCE_HIGH
    );
    callChannel.setDescription("Incoming voice and video call alerts");
    callChannel.setSound(callRingtone, callAudioAttrs);
    callChannel.enableVibration(true);
    callChannel.setVibrationPattern(new long[]{0, 500, 250, 500});
    callChannel.setShowBadge(false);
    nm.createNotificationChannel(callChannel);

    // --- Chat messages ---
    NotificationChannel msgChannel = new NotificationChannel(
        "messages",
        "Messages",
        NotificationManager.IMPORTANCE_HIGH
    );
    msgChannel.setDescription("New direct message notifications");
    msgChannel.enableVibration(true);
    nm.createNotificationChannel(msgChannel);

    // --- General / default ---
    NotificationChannel defaultChannel = new NotificationChannel(
        "default",
        "General",
        NotificationManager.IMPORTANCE_DEFAULT
    );
    defaultChannel.setDescription("General app notifications");
    nm.createNotificationChannel(defaultChannel);
  }

  @Override
  protected void onUserLeaveHint() {
    super.onUserLeaveHint();
    // Only enter PiP when a call or video is active
    if (isPipEligible && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
          .setAspectRatio(new Rational(9, 16));
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        builder.setAutoEnterEnabled(true);
      }
      enterPictureInPictureMode(builder.build());
    }
  }

  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode,
      android.content.res.Configuration newConfig) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
    if (isInPictureInPictureMode) {
      getBridge().getWebView().evaluateJavascript("document.body.classList.add('pip-mode')", null);
    } else {
      getBridge().getWebView().evaluateJavascript("document.body.classList.remove('pip-mode')", null);
    }
  }
}
