# Template for Casks/transcriber.rb in ShiSheng233/homebrew-tap.
# `make release-cask` fills in 1.1 and c41101a6260039bb93ac7a99e8e17f098143ad5295bd6ba95dd06708cb85c48c; see docs/RELEASING.md.
cask "transcriber" do
  version "1.1"
  sha256 "c41101a6260039bb93ac7a99e8e17f098143ad5295bd6ba95dd06708cb85c48c"

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
