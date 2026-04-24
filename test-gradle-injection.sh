#!/bin/bash
# Test script to validate build.gradle injection logic

set -e

echo "🧪 Testing build.gradle injection logic..."

# Create a sample build.gradle similar to what Capacitor generates
TEST_BUILD_GRADLE="/tmp/test-build.gradle"
KEYSTORE_ABS="/home/user/.android/debug.keystore"

cat > "$TEST_BUILD_GRADLE" << 'GRADLE_EOF'
android {
    namespace "com.scadenze.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.scadenze.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
GRADLE_EOF

echo "📄 Initial build.gradle:"
cat "$TEST_BUILD_GRADLE"
echo ""

# Test 1: Inject signingConfigs block
echo "✅ Test 1: Injecting signingConfigs block..."

SIGNING_BLOCK=$(cat <<'SIGNING_EOF'
    signingConfigs {
        debug {
            storeFile file('KEYSTORE_PATH_PLACEHOLDER')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
SIGNING_EOF
)
SIGNING_BLOCK="${SIGNING_BLOCK//KEYSTORE_PATH_PLACEHOLDER/$KEYSTORE_ABS}"

# Inject before buildTypes
awk -v block="$SIGNING_BLOCK" '
  /buildTypes[[:space:]]*\{/ && !done {
    printf "%s\n", block;
    done = 1;
  }
  { print }
' "$TEST_BUILD_GRADLE" > "${TEST_BUILD_GRADLE}.tmp"
mv "${TEST_BUILD_GRADLE}.tmp" "$TEST_BUILD_GRADLE"

echo "📄 After signingConfigs injection:"
cat "$TEST_BUILD_GRADLE"
echo ""

# Test 2: Inject signingConfig reference in debug buildType
echo "✅ Test 2: Injecting signingConfig into debug buildType..."

awk '
  /buildTypes[[:space:]]*\{/ { in_buildtypes=1 }
  in_buildtypes && /debug[[:space:]]*\{/ && !sig_injected {
    print; print "        signingConfig signingConfigs.debug"; sig_injected=1; next
  }
  { print }
' "$TEST_BUILD_GRADLE" > "${TEST_BUILD_GRADLE}.tmp"
mv "${TEST_BUILD_GRADLE}.tmp" "$TEST_BUILD_GRADLE"

echo "📄 After signingConfig injection:"
cat "$TEST_BUILD_GRADLE"
echo ""

# Verify the file has both blocks
echo "✅ Validation:"
if grep -q "signingConfigs {" "$TEST_BUILD_GRADLE"; then
  echo "  ✅ signingConfigs block found"
else
  echo "  ❌ signingConfigs block NOT found"
  exit 1
fi

if grep -q "storeFile file('$KEYSTORE_ABS')" "$TEST_BUILD_GRADLE"; then
  echo "  ✅ Keystore path correctly replaced"
else
  echo "  ❌ Keystore path NOT replaced correctly"
  exit 1
fi

if grep -q "signingConfig signingConfigs.debug" "$TEST_BUILD_GRADLE"; then
  echo "  ✅ signingConfig reference found in debug buildType"
else
  echo "  ❌ signingConfig reference NOT found"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"
rm "$TEST_BUILD_GRADLE"
