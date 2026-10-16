# Template for Casks/transcriber.rb in ShiSheng233/homebrew-tap.
# `make release-cask` fills in 1.2 and 189d3c37cb53d16e96bb2692cc72464efb603e96b05f6e56b8d1812dde69ae21; see docs/RELEASING.md.
cask "transcriber" do
  version "1.2"
  sha256 "189d3c37cb53d16e96bb2692cc72464efb603e96b05f6e56b8d1812dde69ae21"

  url "https://github.com/ShiSheng233/Transcriber/releases/download/v#{version}/Transcriber-#{version}.zip"
  name "Transcriber"
  desc "Generate, edit and translate subtitles with Whisper models"
  homepage "https://github.com/ShiSheng233/Transcriber"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on arch: :arm64
  depends_on macos: :sequoia

  app "Transcriber.app"

  # The default models folder lives in Application Support, so zap also removes
  # downloaded models. API keys stay in the login keychain.
  zap trash: [
    "~/Library/Application Support/Transcriber",
    "~/Library/Caches/dev.shisheng.Transcriber",
    "~/Library/Preferences/dev.shisheng.Transcriber.plist",
    "~/Library/Saved Application State/dev.shisheng.Transcriber.savedState",
  ]
end
