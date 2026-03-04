package com.neighborlink.app;

import android.os.Bundle;
import android.app.PictureInPictureParams;
import android.util.Rational;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.FirebaseApp;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    EdgeToEdge.enable(this);
    super.onCreate(savedInstanceState);
    FirebaseApp.initializeApp(this);
  }

  @Override
  protected void onUserLeaveHint() {
    super.onUserLeaveHint();
    // Basic PiP trigger - can be refined to only trigger during active calls
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      Rational aspect = new Rational(9, 16);
      PictureInPictureParams params = new PictureInPictureParams.Builder()
          .setAspectRatio(aspect)
          .build();
      enterPictureInPictureMode(params);
    }
  }

  @Override
  public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode,
      android.content.res.Configuration newConfig) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
    // Handle UI changes when entering/exiting PiP - e.g. hide controls
    if (isInPictureInPictureMode) {
      getBridge().getWebView().evaluateJavascript("document.body.classList.add('pip-mode')", null);
    } else {
      getBridge().getWebView().evaluateJavascript("document.body.classList.remove('pip-mode')", null);
    }
  }
}
