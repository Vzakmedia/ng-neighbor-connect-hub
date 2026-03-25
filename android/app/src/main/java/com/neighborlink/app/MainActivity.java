package com.neighborlink.app;

import android.app.PictureInPictureParams;
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
