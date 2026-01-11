# Timestamps
URL: /stt/concepts/timestamps

Learn how to use timestamps and understand their granularity.

***

title: Timestamps
description: Learn how to use timestamps and understand their granularity.
keywords: "speech to text timestamps, speech to text time, speech to text word times, stt token timestamps"
-----------------------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI provides **precise timestamps** for every recognized token (word or sub-word).
Timestamps let you align transcriptions with audio, so you know exactly when each word was spoken.

**Timestamps are always included** by default — no extra configuration needed.

***

## Output format

Each token in the response includes:

* `text` → The recognized token.
* `start_ms` → Token start time (in milliseconds).
* `end_ms` → Token end time (in milliseconds).

***

## Example response

In this example, the word **“Beautiful”** is split into three tokens, each with its own timestamp range:

```json
{
  "tokens": [
    {"text": "Beau", "start_ms": 300, "end_ms": 420},
    {"text": "ti",   "start_ms": 420, "end_ms": 540},
    {"text": "ful",  "start_ms": 540, "end_ms": 780}
  ]
}
```

# Get started
URL: /stt/get-started

Learn how to use Soniox Speech-to-Text API.

***

title: Get started
description: Learn how to use Soniox Speech-to-Text API.
keywords: "get started with speech to text, speech to text api, speach recognition api"
---------------------------------------------------------------------------------------

## Learn how to use Soniox API in minutes

Soniox Speech-to-Text is a **universal speech AI** that lets you transcribe and
translate speech in 60+ languages — from recorded files (async) or live audio
streams (real-time). Languages can be freely mixed within the same conversation,
and Soniox will handle them seamlessly with high accuracy and low latency.

In just a few steps, you can run your first transcription or translation. The
examples also cover advanced features such as speaker diarization, real-time
translation, context customization, and automatic language identification — all
through the same simple API.

<Steps>
  <Step>
    ### Get API key

    Create a [Soniox account](https://console.soniox.com/signup) and log in to
    the [Console](https://console.soniox.com) to get your API key.

    <Callout>
      API keys are created per project. In the Console, go to **My First Project** and click **API Keys** to generate one.
    </Callout>

    Export it as an environment variable (replace with your key):

    ```sh title="Terminal"
    export SONIOX_API_KEY=<YOUR_API_KEY>
    ```
  </Step>

  <Step>
    ### Get examples

    Clone the official examples repo:

    ```sh title="Terminal"
    git clone https://github.com/soniox/soniox_examples
    cd soniox_examples/speech_to_text
    ```
  </Step>

  <Step>
    ### Run examples

    Choose your language and run the ready-to-use examples below.

    {/* TABLE START */}

    {/* NOTE(miha): Width is set so that we have maximum of 2 lines in 'Example' column. */}

    {/* NOTE(miha): Font size is set so the table doesn't look "too big". */}

    <div style={{fontSize: '14px'}}>
      | <div style={{width:'170px'}}>Example</div> | What it does                                                                                                            | Output                                                     |
      | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
      | **Real-time <br /> transcription**         | Transcribes speech in any language in <br /> real-time.                                                                 | Transcript streamed to console.                            |
      | **Real-time <br /> one-way translation**   | Transcribes speech in any language and translates it into Spanish in real-time.                                         | Transcript + Spanish translation streamed together.        |
      | **Real-time <br /> two-way translation**   | Transcribes speech in any language and translates English ↔ Spanish in real-time. Spanish → English, English → Spanish. | Transcript + bidirectional translations streamed together. |
      | **Transcribe file from URL**               | Transcribes an audio file directly from a public URL.                                                                   | Transcript printed to console.                             |
      | **Transcribe local file**                  | Uploads and transcribes an audio file from your computer.                                                               | Transcript printed to console.                             |
    </div>

    {/* TABLE END */}

    <Tabs
      items={[
        'Python',
        'Node.js']}
    >
      <Tab>
        {/* NOTE(miha): Empty tag is needed so code block renders correctly */}

        <div />

        ```sh title="Terminal"
        cd python

        # Set up environment
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt

        # Real-time examples
        python soniox_realtime.py --audio_path ../assets/coffee_shop.mp3
        python soniox_realtime.py --audio_path ../assets/coffee_shop.mp3 --translation one_way
        python soniox_realtime.py --audio_path ../assets/two_way_translation.mp3 --translation two_way

        # Async examples
        python soniox_async.py --audio_url "https://soniox.com/media/examples/coffee_shop.mp3"
        python soniox_async.py --audio_path ../assets/coffee_shop.mp3
        ```
      </Tab>

      <Tab>
        {/* NOTE(miha): Empty tag is needed so code block renders correctly */}

        <div />

        ```sh title="Terminal"
        cd nodejs

        # Install dependencies
        npm install

        # Real-time examples
        node soniox_realtime.js --audio_path ../assets/coffee_shop.mp3
        node soniox_realtime.js --audio_path ../assets/coffee_shop.mp3 --translation one_way
        node soniox_realtime.js --audio_path ../assets/two_way_translation.mp3 --translation two_way

        # Async examples
        node soniox_async.js --audio_url "https://soniox.com/media/examples/coffee_shop.mp3"
        node soniox_async.js --audio_path ../assets/coffee_shop.mp3
        ```
      </Tab>
    </Tabs>
  </Step>
</Steps>

## Next steps

* **Dive into the [Real-time API](/stt/rt/real-time-transcription)** → Run live transcription, translations, and endpoint detection.
* **Explore the [Async API](/stt/async/async-transcription)** → Transcribe and translate (recorded) files at scale and integrate with webhooks.

# Real-time transcription
URL: /stt/rt/real-time-transcription

Learn about real-time transcription with low latency and high accuracy for all 60+ languages.

***

title: Real-time transcription
description: Learn about real-time transcription with low latency and high accuracy for all 60+ languages.
keywords: "learn how to transcribe audio in real time, multilingial live transcription, multilingual model"
-----------------------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI lets you transcribe audio in real time with **low latency**
and **high accuracy** in over 60 languages. This is ideal for use cases like **live
captions, voice assistants, streaming analytics, and conversational AI.**

Real-time transcription is provided through our [WebSocket API](/stt/api-reference/websocket-api), which streams
results back to you as the audio is processed.

***

## How processing works

As audio is streamed into the API, Soniox returns a continuous stream of **tokens** — small units of text such as subwords, words, or spaces.

Each token carries a status flag (`is_final`) that tells you whether the token is **provisional** or **confirmed:**

* **Non-final token** (`is_final: false`) → Provisional text. Appears instantly but may change, disappear, or be replaced as more audio arrives.
* **Final token** (`is_final: true`) → Confirmed text. Once marked final, it will never change in future responses.

This means you get text right away (non-final for instant feedback), followed by the confirmed version (final for stable output).

<Callout type="warn">
  Non-final tokens may appear multiple times and change slightly until they stabilize into a final token. Final tokens are sent only once and never repeated.
</Callout>

### Example token evolution

Here’s how `"How are you doing?"` might arrive over time:

<Steps>
  <Step>
    **Initial guess (non-final):**

    ```json
    {"tokens": [{"text": "How",    "is_final": false},
                {"text": "'re",    "is_final": false}]}
    ```
  </Step>

  <Step>
    **Refined guess (non-final):**

    ```json
    {"tokens": [{"text": "How",    "is_final": false},
                {"text": " ",      "is_final": false},
                {"text": "are",    "is_final": false}]}
    ```
  </Step>

  <Step>
    **Mixed output (final + non-final):**

    ```json
    {"tokens": [{"text": "How",    "is_final": true},
                {"text": " ",      "is_final": true},
                {"text": "are",    "is_final": false},
                {"text": " ",      "is_final": false},
                {"text": "you",    "is_final": false}]}
    ```
  </Step>

  <Step>
    **Mixed output (final + non-final):**

    ```json
    {"tokens": [{"text": "are",    "is_final": true},
                {"text": " ",      "is_final": true},
                {"text": "you",    "is_final": true},
                {"text": " ",      "is_final": false},
                {"text": "do",     "is_final": false},
                {"text": "ing",    "is_final": false},
                {"text": "?",      "is_final": false}]}
    ```
  </Step>

  <Step>
    **Confirmed tokens (final):**

    ```json
    {"tokens": [{"text": " ",      "is_final": true},
                {"text": "do",     "is_final": true},
                {"text": "ing",    "is_final": true},
                {"text": "?",      "is_final": true}]}
    ```
  </Step>
</Steps>

**Bottom line:** The model may start with a shorthand guess like “How’re”, then
refine it into “How are you”, and finally extend it into “How are you doing?”.
Non-final tokens update instantly, while final tokens never change once
confirmed.

***

## Audio progress tracking

Each response also tells you **how much audio has been processed**:

* `audio_final_proc_ms` — audio processed into **final tokens.**
* `audio_total_proc_ms` — audio processed into **final + non-final tokens.**

Example:

```json
{
  "audio_final_proc_ms": 4800,
  "audio_total_proc_ms": 5250
}
```

**This means:**

* Audio up to **4.8s** has been processed and finalized (final tokens).
* Audio up to **5.25s** has been processed in total (final + non-final tokens).

***

## Getting final tokens sooner

There are two ways to obtain final tokens more quickly:

1. [Endpoint detection](/stt/rt/endpoint-detection) — the model can detect when a speaker has stopped talking and finalize tokens immediately.
2. [Manual finalization](/stt/rt/manual-finalization) — you can send a `"type": "finalize"` message over the WebSocket to force all pending tokens to finalize.

{/* **Example: Transcribe a live audio stream** */}

***

## Audio formats

Soniox supports both **auto-detected formats** (no configuration required) and **raw audio formats** (manual configuration required).

### Auto-detected formats

Soniox can automatically detect common container formats from stream headers.
No configuration needed — just set:

```json
{
  "audio_format": "auto"
}
```

Supported auto formats:

```text
aac, aiff, amr, asf, flac, mp3, ogg, wav, webm
```

### Raw audio formats

For raw audio streams without headers, you must provide:

* `audio_format` → encoding type.
* `sample_rate` →  sample rate in Hz.
* `num_channels` → number of channels (e.g. 1 (mono) or 2 (stereo)).

**Supported encodings:**

* PCM (signed): `pcm_s8`, `pcm_s16`, `pcm_s24`, `pcm_s32` (`le`/`be`).
* PCM (unsigned): `pcm_u8`, `pcm_u16`, `pcm_u24`, `pcm_u32` (`le`/`be`).
* Float PCM: `pcm_f32`, `pcm_f64` (`le`/`be`).
* Companded: `mulaw`, `alaw`.

**Example: raw PCM (16-bit, 16kHz, mono)**

```json
{
  "audio_format": "pcm_s16le",
  "sample_rate": 16000,
  "num_channels": 1
}
```

***

## Code example

**Prerequisite:** Complete the steps in [Get started](/stt/get-started).

<Tabs
  items={[
  'Python',
  'Node.js']}
>
  <Tab>
    <Accordions>
      <Accordion title="Code" id="code">
        See on GitHub: [soniox\_realtime.py](https://github.com/soniox/soniox_examples/blob/master/speech_to_text/python/soniox_realtime.py).

        <FileCodeBlock path="./content/stt/rt/_examples/soniox_realtime.py" lang="python">
          ```
          import json
          import os
          import threading
          import time
          import argparse
          from typing import Optional

          from websockets import ConnectionClosedOK
          from websockets.sync.client import connect

          SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket"


          # Get Soniox STT config.
          def get_config(api_key: str, audio_format: str, translation: str) -> dict:
              config = {
                  # Get your API key at console.soniox.com, then run: export SONIOX_API_KEY=<YOUR_API_KEY>
                  "api_key": api_key,
                  #
                  # Select the model to use.
                  # See: soniox.com/docs/stt/models
                  "model": "stt-rt-v3",
                  #
                  # Set language hints when possible to significantly improve accuracy.
                  # See: soniox.com/docs/stt/concepts/language-hints
                  "language_hints": ["en", "es"],
                  #
                  # Enable language identification. Each token will include a "language" field.
                  # See: soniox.com/docs/stt/concepts/language-identification
                  "enable_language_identification": True,
                  #
                  # Enable speaker diarization. Each token will include a "speaker" field.
                  # See: soniox.com/docs/stt/concepts/speaker-diarization
                  "enable_speaker_diarization": True,
                  #
                  # Set context to help the model understand your domain, recognize important terms,
                  # and apply custom vocabulary and translation preferences.
                  # See: soniox.com/docs/stt/concepts/context
                  "context": {
                      "general": [
                          {"key": "domain", "value": "Healthcare"},
                          {"key": "topic", "value": "Diabetes management consultation"},
                          {"key": "doctor", "value": "Dr. Martha Smith"},
                          {"key": "patient", "value": "Mr. David Miller"},
                          {"key": "organization", "value": "St John's Hospital"},
                      ],
                      "text": "Mr. David Miller visited his healthcare provider last month for a routine follow-up related to diabetes care. The clinician reviewed his recent test results, noted improved glucose levels, and adjusted his medication schedule accordingly. They also discussed meal planning strategies and scheduled the next check-up for early spring.",
                      "terms": [
                          "Celebrex",
                          "Zyrtec",
                          "Xanax",
                          "Prilosec",
                          "Amoxicillin Clavulanate Potassium",
                      ],
                      "translation_terms": [
                          {"source": "Mr. Smith", "target": "Sr. Smith"},
                          {"source": "St John's", "target": "St John's"},
                          {"source": "stroke", "target": "ictus"},
                      ],
                  },
                  #
                  # Use endpointing to detect when the speaker stops.
                  # It finalizes all non-final tokens right away, minimizing latency.
                  # See: soniox.com/docs/stt/rt/endpoint-detection
                  "enable_endpoint_detection": True,
              }

              # Audio format.
              # See: soniox.com/docs/stt/rt/real-time-transcription#audio-formats
              if audio_format == "auto":
                  # Set to "auto" to let Soniox detect the audio format automatically.
                  config["audio_format"] = "auto"
              elif audio_format == "pcm_s16le":
                  # Example of a raw audio format; Soniox supports many others as well.
                  config["audio_format"] = "pcm_s16le"
                  config["sample_rate"] = 16000
                  config["num_channels"] = 1
              else:
                  raise ValueError(f"Unsupported audio_format: {audio_format}")

              # Translation options.
              # See: soniox.com/docs/stt/rt/real-time-translation#translation-modes
              if translation == "none":
                  pass
              elif translation == "one_way":
                  # Translates all languages into the target language.
                  config["translation"] = {
                      "type": "one_way",
                      "target_language": "es",
                  }
              elif translation == "two_way":
                  # Translates from language_a to language_b and back from language_b to language_a.
                  config["translation"] = {
                      "type": "two_way",
                      "language_a": "en",
                      "language_b": "es",
                  }
              else:
                  raise ValueError(f"Unsupported translation: {translation}")

              return config


          # Read the audio file and send its bytes to the websocket.
          def stream_audio(audio_path: str, ws) -> None:
              with open(audio_path, "rb") as fh:
                  while True:
                      data = fh.read(3840)
                      if len(data) == 0:
                          break
                      ws.send(data)
                      # Sleep for 120 ms to simulate real-time streaming.
                      time.sleep(0.120)

              # Empty string signals end-of-audio to the server
              ws.send("")


          # Convert tokens into a readable transcript.
          def render_tokens(final_tokens: list[dict], non_final_tokens: list[dict]) -> str:
              text_parts: list[str] = []
              current_speaker: Optional[str] = None
              current_language: Optional[str] = None

              # Process all tokens in order.
              for token in final_tokens + non_final_tokens:
                  text = token["text"]
                  speaker = token.get("speaker")
                  language = token.get("language")
                  is_translation = token.get("translation_status") == "translation"

                  # Speaker changed -> add a speaker tag.
                  if speaker is not None and speaker != current_speaker:
                      if current_speaker is not None:
                          text_parts.append("\n\n")
                      current_speaker = speaker
                      current_language = None  # Reset language on speaker changes.
                      text_parts.append(f"Speaker {current_speaker}:")

                  # Language changed -> add a language or translation tag.
                  if language is not None and language != current_language:
                      current_language = language
                      prefix = "[Translation] " if is_translation else ""
                      text_parts.append(f"\n{prefix}[{current_language}] ")
                      text = text.lstrip()

                  text_parts.append(text)

              text_parts.append("\n===============================")

              return "".join(text_parts)


          def run_session(
              api_key: str,
              audio_path: str,
              audio_format: str,
              translation: str,
          ) -> None:
              config = get_config(api_key, audio_format, translation)

              print("Connecting to Soniox...")
              with connect(SONIOX_WEBSOCKET_URL) as ws:
                  # Send first request with config.
                  ws.send(json.dumps(config))

                  # Start streaming audio in the background.
                  threading.Thread(
                      target=stream_audio,
                      args=(audio_path, ws),
                      daemon=True,
                  ).start()

                  print("Session started.")

                  final_tokens: list[dict] = []

                  try:
                      while True:
                          message = ws.recv()
                          res = json.loads(message)

                          # Error from server.
                          # See: https://soniox.com/docs/stt/api-reference/websocket-api#error-response
                          if res.get("error_code") is not None:
                              print(f"Error: {res['error_code']} - {res['error_message']}")
                              break

                          # Parse tokens from current response.
                          non_final_tokens: list[dict] = []
                          for token in res.get("tokens", []):
                              if token.get("text"):
                                  if token.get("is_final"):
                                      # Final tokens are returned once and should be appended to final_tokens.
                                      final_tokens.append(token)
                                  else:
                                      # Non-final tokens update as more audio arrives; reset them on every response.
                                      non_final_tokens.append(token)

                          # Render tokens.
                          text = render_tokens(final_tokens, non_final_tokens)
                          print(text)

                          # Session finished.
                          if res.get("finished"):
                              print("Session finished.")

                  except ConnectionClosedOK:
                      # Normal, server closed after finished.
                      pass
                  except KeyboardInterrupt:
                      print("\nInterrupted by user.")
                  except Exception as e:
                      print(f"Error: {e}")


          def main():
              parser = argparse.ArgumentParser()
              parser.add_argument("--audio_path", type=str)
              parser.add_argument("--audio_format", default="auto")
              parser.add_argument("--translation", default="none")
              args = parser.parse_args()

              api_key = os.environ.get("SONIOX_API_KEY")
              if api_key is None:
                  raise RuntimeError("Missing SONIOX_API_KEY.")

              run_session(api_key, args.audio_path, args.audio_format, args.translation)


          if __name__ == "__main__":
              main()

          ```
        </FileCodeBlock>
      </Accordion>

      <Accordion title="Run" id="run">
        ```sh title="Terminal"
        # Transcribe a live audio stream
        python soniox_realtime.py --audio_path ../assets/coffee_shop.mp3

        # Transcribe a raw audio live stream
        python soniox_realtime.py --audio_path ../assets/coffee_shop.pcm_s16le --audio_format pcm_s16le
        ```
      </Accordion>
    </Accordions>
  </Tab>

  <Tab>
    <Accordions>
      <Accordion title="Code" id="code">
        See on GitHub: [soniox\_realtime.js](https://github.com/soniox/soniox_examples/blob/master/speech_to_text/nodejs/soniox_realtime.js).

        <FileCodeBlock path="./content/stt/rt/_examples/soniox_realtime.js" lang="js">
          ```
          import fs from "fs";
          import WebSocket from "ws";
          import { parseArgs } from "node:util";

          const SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

          // Get Soniox STT config
          function getConfig(apiKey, audioFormat, translation) {
            const config = {
              // Get your API key at console.soniox.com, then run: export SONIOX_API_KEY=<YOUR_API_KEY>
              api_key: apiKey,

              // Select the model to use.
              // See: soniox.com/docs/stt/models
              model: "stt-rt-v3",

              // Set language hints when possible to significantly improve accuracy.
              // See: soniox.com/docs/stt/concepts/language-hints
              language_hints: ["en", "es"],

              // Enable language identification. Each token will include a "language" field.
              // See: soniox.com/docs/stt/concepts/language-identification
              enable_language_identification: true,

              // Enable speaker diarization. Each token will include a "speaker" field.
              // See: soniox.com/docs/stt/concepts/speaker-diarization
              enable_speaker_diarization: true,

              // Set context to help the model understand your domain, recognize important terms,
              // and apply custom vocabulary and translation preferences.
              // See: soniox.com/docs/stt/concepts/context
              context: {
                general: [
                  { key: "domain", value: "Healthcare" },
                  { key: "topic", value: "Diabetes management consultation" },
                  { key: "doctor", value: "Dr. Martha Smith" },
                  { key: "patient", value: "Mr. David Miller" },
                  { key: "organization", value: "St John's Hospital" },
                ],
                text: "Mr. David Miller visited his healthcare provider last month for a routine follow-up related to diabetes care. The clinician reviewed his recent test results, noted improved glucose levels, and adjusted his medication schedule accordingly. They also discussed meal planning strategies and scheduled the next check-up for early spring.",
                terms: [
                  "Celebrex",
                  "Zyrtec",
                  "Xanax",
                  "Prilosec",
                  "Amoxicillin Clavulanate Potassium",
                ],
                translation_terms: [
                  { source: "Mr. Smith", target: "Sr. Smith" },
                  { source: "St John's", target: "St John's" },
                  { source: "stroke", target: "ictus" },
                ],
              },

              // Use endpointing to detect when the speaker stops.
              // It finalizes all non-final tokens right away, minimizing latency.
              // See: soniox.com/docs/stt/rt/endpoint-detection
              enable_endpoint_detection: true,
            };

            // Audio format.
            // See: soniox.com/docs/stt/rt/real-time-transcription#audio-formats
            if (audioFormat === "auto") {
              // Set to "auto" to let Soniox detect the audio format automatically.
              config.audio_format = "auto";
            } else if (audioFormat === "pcm_s16le") {
              // Example of a raw audio format; Soniox supports many others as well.
              config.audio_format = "pcm_s16le";
              config.sample_rate = 16000;
              config.num_channels = 1;
            } else {
              throw new Error(`Unsupported audio_format: ${audioFormat}`);
            }

            // Translation options.
            // See: soniox.com/docs/stt/rt/real-time-translation#translation-modes
            if (translation === "one_way") {
              // Translates all languages into the target language.
              config.translation = { type: "one_way", target_language: "es" };
            } else if (translation === "two_way") {
              // Translates from language_a to language_b and back from language_b to language_a.
              config.translation = {
                type: "two_way",
                language_a: "en",
                language_b: "es",
              };
            } else if (translation !== "none") {
              throw new Error(`Unsupported translation: ${translation}`);
            }

            return config;
          }

          // Read the audio file and send its bytes to the websocket.
          async function streamAudio(audioPath, ws) {
            const stream = fs.createReadStream(audioPath, { highWaterMark: 3840 });

            for await (const chunk of stream) {
              ws.send(chunk);
              // Sleep for 120 ms to simulate real-time streaming.
              await new Promise((res) => setTimeout(res, 120));
            }

            // Empty string signals end-of-audio to the server
            ws.send("");
          }

          // Convert tokens into readable transcript
          function renderTokens(finalTokens, nonFinalTokens) {
            let textParts = [];
            let currentSpeaker = null;
            let currentLanguage = null;

            const allTokens = [...finalTokens, ...nonFinalTokens];

            // Process all tokens in order.
            for (const token of allTokens) {
              let { text, speaker, language } = token;
              const isTranslation = token.translation_status === "translation";

              // Speaker changed -> add a speaker tag.
              if (speaker && speaker !== currentSpeaker) {
                if (currentSpeaker !== null) textParts.push("\n\n");
                currentSpeaker = speaker;
                currentLanguage = null; // Reset language on speaker changes.
                textParts.push(`Speaker ${currentSpeaker}:`);
              }

              // Language changed -> add a language or translation tag.
              if (language && language !== currentLanguage) {
                currentLanguage = language;
                const prefix = isTranslation ? "[Translation] " : "";
                textParts.push(`\n${prefix}[${currentLanguage}] `);
                text = text.trimStart();
              }

              textParts.push(text);
            }

            textParts.push("\n===============================");
            return textParts.join("");
          }

          function runSession(apiKey, audioPath, audioFormat, translation) {
            const config = getConfig(apiKey, audioFormat, translation);

            console.log("Connecting to Soniox...");
            const ws = new WebSocket(SONIOX_WEBSOCKET_URL);

            let finalTokens = [];

            ws.on("open", () => {
              // Send first request with config.
              ws.send(JSON.stringify(config));

              // Start streaming audio in the background.
              streamAudio(audioPath, ws).catch((err) =>
                console.error("Audio stream error:", err),
              );
              console.log("Session started.");
            });

            ws.on("message", (msg) => {
              const res = JSON.parse(msg.toString());

              // Error from server.
              // See: https://soniox.com/docs/stt/api-reference/websocket-api#error-response
              if (res.error_code) {
                console.error(`Error: ${res.error_code} - ${res.error_message}`);
                ws.close();
                return;
              }

              // Parse tokens from current response.
              let nonFinalTokens = [];
              if (res.tokens) {
                for (const token of res.tokens) {
                  if (token.text) {
                    if (token.is_final) {
                      // Final tokens are returned once and should be appended to final_tokens.
                      finalTokens.push(token);
                    } else {
                      // Non-final tokens update as more audio arrives; reset them on every response.
                      nonFinalTokens.push(token);
                    }
                  }
                }
              }

              // Render tokens.
              const text = renderTokens(finalTokens, nonFinalTokens);
              console.log(text);

              // Session finished.
              if (res.finished) {
                console.log("Session finished.");
                ws.close();
              }
            });

            ws.on("error", (err) => console.error("WebSocket error:", err));
          }

          async function main() {
            const { values: argv } = parseArgs({
              options: {
                audio_path: { type: "string", required: true },
                audio_format: { type: "string", default: "auto" },
                translation: { type: "string", default: "none" },
              },
            });

            const apiKey = process.env.SONIOX_API_KEY;
            if (!apiKey) {
              throw new Error(
                "Missing SONIOX_API_KEY.\n" +
                  "1. Get your API key at https://console.soniox.com\n" +
                  "2. Run: export SONIOX_API_KEY=<YOUR_API_KEY>",
              );
            }

            runSession(apiKey, argv.audio_path, argv.audio_format, argv.translation);
          }

          main().catch((err) => {
            console.error("Error:", err.message);
            process.exit(1);
          });

          ```
        </FileCodeBlock>
      </Accordion>

      <Accordion title="Run" id="run">
        ```sh title="Terminal"
        # Transcribe a live audio stream
        node soniox_realtime.js --audio_path ../assets/coffee_shop.mp3

        # Transcribe a raw audio live stream
        node soniox_realtime.js --audio_path ../assets/coffee_shop.pcm_s16le --audio_format pcm_s16le
        ```
      </Accordion>
    </Accordions>
  </Tab>
</Tabs>

# Real-time translation
URL: /stt/rt/real-time-translation

Learn how real-time translation works.

***

title: Real-time translation
description: Learn how real-time translation works.
---------------------------------------------------

import { CodeBlock, Pre } from "@/components/codeblock";
import { DynamicCodeBlock } from "@/components/dynamic-codeblock";
import { LuTriangleAlert } from "react-icons/lu";

## Overview

Soniox Speech-to-Text AI introduces a new kind of translation designed
for low latency applications. Unlike traditional systems that wait until
the end of a sentence before producing a translation, Soniox translates
**mid-sentence**—as words are spoken. This innovation enables a completely new
experience: you can follow conversations across languages in real-time, without
delays.

***

## How it works

* **Always transcribes speech:** every spoken word is transcribed, regardless of translation settings.
* **Translation:** choose between:
  * **One-way translation** → translate all speech into a single target language.
  * **Two-way translation** → translate back and forth between two languages.
* **Low latency:** translations are streamed in chunks, balancing speed and accuracy.
* **Unified token stream:** transcriptions and translations arrive together, labeled for easy handling.

### Example

Speaker says:

```json
"Hello everyone, thank you for joining us today."
```

The token stream unfolds like this:

```json
[Transcription] Hello everyone,
[Translation]   Bonjour à tous,

[Transcription] thank you
[Translation]   merci

[Transcription] for joining us
[Translation]   de nous avoir rejoints

[Transcription] today.
[Translation]   aujourd'hui.
```

Notice how:

* **Transcription tokens arrive first,** as soon as words are recognized.
* **Translation tokens follow,** chunk by chunk, without waiting for the full sentence.
* Developers can display tokens immediately for **low latency transcription and translation.**

***

## Translation modes

Soniox provides two translation modes: translate all speech into a single target language, or enable seamless two-way conversations between languages.

### One-way translation

Translate **all spoken languages** into a single target language.

**Example: translate everything into French**

```json
{
  "translation": {
    "type": "one_way",
    "target_language": "fr"
  }
}
```

* All speech is **transcribed.**
* All speech is **translated into French.**

### Two-way translation

Translate **back and forth** between two specified languages.

**Example: Japanese ⟷ Korean**

```json
{
  "translation": {
    "type": "two_way",
    "language_a": "ja",
    "language_b": "ko"
  }
}
```

* All speech is **transcribed.**
* Japanese speech is **translated into Korean.**
* Korean speech is **translated into Japanese.**

***

## Token format

Each result (transcription or translation) is returned as a **token** with clear metadata.

| Field                | Description                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `text`               | Token text                                                                                           |
| `translation_status` | `"none"` (not translated) <br /> `"original"` (spoken text) <br /> `"translation"` (translated text) |
| `language`           | Language of the token                                                                                |
| `source_language`    | Original language (only for translated tokens)                                                       |

### Example: two-way translation

Two way translation between English (`en`) and German (`de`).

**Config**

```json
{
  "translation": {
    "type": "two_way",
    "language_a": "en",
    "language_b": "de"
  }
}
```

**Text**

```json
[en] Good morning
[de] Guten Morgen

[de] Wie geht’s?
[en] How are you?

[fr] Bonjour à tous
(fr is only transcribed, not translated)

[en] I’m fine, thanks.
[de] Mir geht’s gut, danke.
```

**Tokens**

{/* NOTE(miha): ``` tags put this code into scrollable view, that we didn't want */}

<DynamicCodeBlock
  lang="json"
  code={`// ===== (1) =====
// Transcription tokens to be translated
{
  "text": "Good",
  "translation_status": "original",
  "language": "en"
}
{
  "text": " morn",
  "translation_status": "original",
  "language": "en"
}
{
  "text": "ing",
  "translation_status": "original",
  "language": "en"
}
// Translation tokens of previous transcription tokens
{
  "text": "Gu",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": "ten",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": " Morgen",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}

// ===== (2) =====
// Transcription tokens to be translated
{
  "text": "Wie",
  "translation_status": "original",
  "language": "de"
}
{
  "text": " geht’s?",
  "translation_status": "original",
  "language": "de"
}
// Translation tokens of previous transcription tokens
{
  "text": "How",
  "translation_status": "translation",
  "language": "en",
  "source_language": "de"
}
{
  "text": " are",
  "translation_status": "translation",
  "language": "en",
  "source_language": "de"
}
{
  "text": " you",
  "translation_status": "translation",
  "language": "en",
  "source_language": "de"
}
{
  "text": "?",
  "translation_status": "translation",
  "language": "en",
  "source_language": "de"
}

// ===== (3) =====
// Transcription tokens NOT to be translated
{
  "text": "Bon",
  "translation_status": "none",
  "language": "fr"
}
{
  "text": "jour",
  "translation_status": "none",
  "language": "fr"
}
{
  "text": " à",
  "translation_status": "none",
  "language": "fr"
}
{
  "text": " tous",
  "translation_status": "none",
  "language": "fr"
}

// ===== (4) =====
// Transcription tokens to be translated
{
  "text": "I’m",
  "translation_status": "original",
  "language": "en"
}
{
  "text": " fine,",
  "translation_status": "original",
  "language": "en"
}
{
  "text": " thanks.",
  "translation_status": "original",
  "language": "en"
}
// Translation tokens of previous transcription tokens
{
  "text": "Mir",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": " geht’s",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": " gut",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": " dan",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}
{
  "text": "ke.",
  "translation_status": "translation",
  "language": "de",
  "source_language": "en"
}`}
/>

<Callout type="warn">
  Transcription and translation chunks follow each
  other, but tokens are not 1-to-1 mapped and may not align.
</Callout>

***

## Supported languages

**All pairs supported** — translate between any two [supported languages](/stt/concepts/supported-languages).

***

## Timestamps

* **Spoken tokens** (`translation_status: "none"` or `"original"`) include timestamps (`start_ms`, `end_ms`) that align to the exact position in the audio.
* **Translated tokens do not** include timestamps, since they are generated
  immediately after the spoken tokens and directly follow their timing.

This way, you can always align transcripts to the original audio, while translations stream naturally in sequence.

***

## Code example

**Prerequisite:** Complete the steps in [Get started](/stt/get-started).

<Tabs
  items={[
  'Python',
  'Node.js']}
>
  <Tab>
    <Accordions>
      <Accordion title="Code" id="code">
        See on GitHub: [soniox\_realtime.py](https://github.com/soniox/soniox_examples/blob/master/speech_to_text/python/soniox_realtime.py).

        <FileCodeBlock path="./content/stt/rt/_examples/soniox_realtime.py" lang="python">
          ```
          import json
          import os
          import threading
          import time
          import argparse
          from typing import Optional

          from websockets import ConnectionClosedOK
          from websockets.sync.client import connect

          SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket"


          # Get Soniox STT config.
          def get_config(api_key: str, audio_format: str, translation: str) -> dict:
              config = {
                  # Get your API key at console.soniox.com, then run: export SONIOX_API_KEY=<YOUR_API_KEY>
                  "api_key": api_key,
                  #
                  # Select the model to use.
                  # See: soniox.com/docs/stt/models
                  "model": "stt-rt-v3",
                  #
                  # Set language hints when possible to significantly improve accuracy.
                  # See: soniox.com/docs/stt/concepts/language-hints
                  "language_hints": ["en", "es"],
                  #
                  # Enable language identification. Each token will include a "language" field.
                  # See: soniox.com/docs/stt/concepts/language-identification
                  "enable_language_identification": True,
                  #
                  # Enable speaker diarization. Each token will include a "speaker" field.
                  # See: soniox.com/docs/stt/concepts/speaker-diarization
                  "enable_speaker_diarization": True,
                  #
                  # Set context to help the model understand your domain, recognize important terms,
                  # and apply custom vocabulary and translation preferences.
                  # See: soniox.com/docs/stt/concepts/context
                  "context": {
                      "general": [
                          {"key": "domain", "value": "Healthcare"},
                          {"key": "topic", "value": "Diabetes management consultation"},
                          {"key": "doctor", "value": "Dr. Martha Smith"},
                          {"key": "patient", "value": "Mr. David Miller"},
                          {"key": "organization", "value": "St John's Hospital"},
                      ],
                      "text": "Mr. David Miller visited his healthcare provider last month for a routine follow-up related to diabetes care. The clinician reviewed his recent test results, noted improved glucose levels, and adjusted his medication schedule accordingly. They also discussed meal planning strategies and scheduled the next check-up for early spring.",
                      "terms": [
                          "Celebrex",
                          "Zyrtec",
                          "Xanax",
                          "Prilosec",
                          "Amoxicillin Clavulanate Potassium",
                      ],
                      "translation_terms": [
                          {"source": "Mr. Smith", "target": "Sr. Smith"},
                          {"source": "St John's", "target": "St John's"},
                          {"source": "stroke", "target": "ictus"},
                      ],
                  },
                  #
                  # Use endpointing to detect when the speaker stops.
                  # It finalizes all non-final tokens right away, minimizing latency.
                  # See: soniox.com/docs/stt/rt/endpoint-detection
                  "enable_endpoint_detection": True,
              }

              # Audio format.
              # See: soniox.com/docs/stt/rt/real-time-transcription#audio-formats
              if audio_format == "auto":
                  # Set to "auto" to let Soniox detect the audio format automatically.
                  config["audio_format"] = "auto"
              elif audio_format == "pcm_s16le":
                  # Example of a raw audio format; Soniox supports many others as well.
                  config["audio_format"] = "pcm_s16le"
                  config["sample_rate"] = 16000
                  config["num_channels"] = 1
              else:
                  raise ValueError(f"Unsupported audio_format: {audio_format}")

              # Translation options.
              # See: soniox.com/docs/stt/rt/real-time-translation#translation-modes
              if translation == "none":
                  pass
              elif translation == "one_way":
                  # Translates all languages into the target language.
                  config["translation"] = {
                      "type": "one_way",
                      "target_language": "es",
                  }
              elif translation == "two_way":
                  # Translates from language_a to language_b and back from language_b to language_a.
                  config["translation"] = {
                      "type": "two_way",
                      "language_a": "en",
                      "language_b": "es",
                  }
              else:
                  raise ValueError(f"Unsupported translation: {translation}")

              return config


          # Read the audio file and send its bytes to the websocket.
          def stream_audio(audio_path: str, ws) -> None:
              with open(audio_path, "rb") as fh:
                  while True:
                      data = fh.read(3840)
                      if len(data) == 0:
                          break
                      ws.send(data)
                      # Sleep for 120 ms to simulate real-time streaming.
                      time.sleep(0.120)

              # Empty string signals end-of-audio to the server
              ws.send("")


          # Convert tokens into a readable transcript.
          def render_tokens(final_tokens: list[dict], non_final_tokens: list[dict]) -> str:
              text_parts: list[str] = []
              current_speaker: Optional[str] = None
              current_language: Optional[str] = None

              # Process all tokens in order.
              for token in final_tokens + non_final_tokens:
                  text = token["text"]
                  speaker = token.get("speaker")
                  language = token.get("language")
                  is_translation = token.get("translation_status") == "translation"

                  # Speaker changed -> add a speaker tag.
                  if speaker is not None and speaker != current_speaker:
                      if current_speaker is not None:
                          text_parts.append("\n\n")
                      current_speaker = speaker
                      current_language = None  # Reset language on speaker changes.
                      text_parts.append(f"Speaker {current_speaker}:")

                  # Language changed -> add a language or translation tag.
                  if language is not None and language != current_language:
                      current_language = language
                      prefix = "[Translation] " if is_translation else ""
                      text_parts.append(f"\n{prefix}[{current_language}] ")
                      text = text.lstrip()

                  text_parts.append(text)

              text_parts.append("\n===============================")

              return "".join(text_parts)


          def run_session(
              api_key: str,
              audio_path: str,
              audio_format: str,
              translation: str,
          ) -> None:
              config = get_config(api_key, audio_format, translation)

              print("Connecting to Soniox...")
              with connect(SONIOX_WEBSOCKET_URL) as ws:
                  # Send first request with config.
                  ws.send(json.dumps(config))

                  # Start streaming audio in the background.
                  threading.Thread(
                      target=stream_audio,
                      args=(audio_path, ws),
                      daemon=True,
                  ).start()

                  print("Session started.")

                  final_tokens: list[dict] = []

                  try:
                      while True:
                          message = ws.recv()
                          res = json.loads(message)

                          # Error from server.
                          # See: https://soniox.com/docs/stt/api-reference/websocket-api#error-response
                          if res.get("error_code") is not None:
                              print(f"Error: {res['error_code']} - {res['error_message']}")
                              break

                          # Parse tokens from current response.
                          non_final_tokens: list[dict] = []
                          for token in res.get("tokens", []):
                              if token.get("text"):
                                  if token.get("is_final"):
                                      # Final tokens are returned once and should be appended to final_tokens.
                                      final_tokens.append(token)
                                  else:
                                      # Non-final tokens update as more audio arrives; reset them on every response.
                                      non_final_tokens.append(token)

                          # Render tokens.
                          text = render_tokens(final_tokens, non_final_tokens)
                          print(text)

                          # Session finished.
                          if res.get("finished"):
                              print("Session finished.")

                  except ConnectionClosedOK:
                      # Normal, server closed after finished.
                      pass
                  except KeyboardInterrupt:
                      print("\nInterrupted by user.")
                  except Exception as e:
                      print(f"Error: {e}")


          def main():
              parser = argparse.ArgumentParser()
              parser.add_argument("--audio_path", type=str)
              parser.add_argument("--audio_format", default="auto")
              parser.add_argument("--translation", default="none")
              args = parser.parse_args()

              api_key = os.environ.get("SONIOX_API_KEY")
              if api_key is None:
                  raise RuntimeError("Missing SONIOX_API_KEY.")

              run_session(api_key, args.audio_path, args.audio_format, args.translation)


          if __name__ == "__main__":
              main()

          ```
        </FileCodeBlock>
      </Accordion>

      <Accordion title="Run" id="run">
        ```sh title="Terminal"
        # One-way translation of a live audio stream
        python soniox_realtime.py --audio_path ../assets/coffee_shop.mp3 --translation one_way

        # Two-way translation of a live audio stream
        python soniox_realtime.py --audio_path ../assets/two_way_translation.mp3 --translation two_way
        ```
      </Accordion>
    </Accordions>
  </Tab>

  <Tab>
    <Accordions>
      <Accordion title="Code" id="code">
        See on GitHub: [soniox\_realtime.js](https://github.com/soniox/soniox_examples/blob/master/speech_to_text/nodejs/soniox_realtime.js).

        <FileCodeBlock path="./content/stt/rt/_examples/soniox_realtime.js" lang="js">
          ```
          import fs from "fs";
          import WebSocket from "ws";
          import { parseArgs } from "node:util";

          const SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

          // Get Soniox STT config
          function getConfig(apiKey, audioFormat, translation) {
            const config = {
              // Get your API key at console.soniox.com, then run: export SONIOX_API_KEY=<YOUR_API_KEY>
              api_key: apiKey,

              // Select the model to use.
              // See: soniox.com/docs/stt/models
              model: "stt-rt-v3",

              // Set language hints when possible to significantly improve accuracy.
              // See: soniox.com/docs/stt/concepts/language-hints
              language_hints: ["en", "es"],

              // Enable language identification. Each token will include a "language" field.
              // See: soniox.com/docs/stt/concepts/language-identification
              enable_language_identification: true,

              // Enable speaker diarization. Each token will include a "speaker" field.
              // See: soniox.com/docs/stt/concepts/speaker-diarization
              enable_speaker_diarization: true,

              // Set context to help the model understand your domain, recognize important terms,
              // and apply custom vocabulary and translation preferences.
              // See: soniox.com/docs/stt/concepts/context
              context: {
                general: [
                  { key: "domain", value: "Healthcare" },
                  { key: "topic", value: "Diabetes management consultation" },
                  { key: "doctor", value: "Dr. Martha Smith" },
                  { key: "patient", value: "Mr. David Miller" },
                  { key: "organization", value: "St John's Hospital" },
                ],
                text: "Mr. David Miller visited his healthcare provider last month for a routine follow-up related to diabetes care. The clinician reviewed his recent test results, noted improved glucose levels, and adjusted his medication schedule accordingly. They also discussed meal planning strategies and scheduled the next check-up for early spring.",
                terms: [
                  "Celebrex",
                  "Zyrtec",
                  "Xanax",
                  "Prilosec",
                  "Amoxicillin Clavulanate Potassium",
                ],
                translation_terms: [
                  { source: "Mr. Smith", target: "Sr. Smith" },
                  { source: "St John's", target: "St John's" },
                  { source: "stroke", target: "ictus" },
                ],
              },

              // Use endpointing to detect when the speaker stops.
              // It finalizes all non-final tokens right away, minimizing latency.
              // See: soniox.com/docs/stt/rt/endpoint-detection
              enable_endpoint_detection: true,
            };

            // Audio format.
            // See: soniox.com/docs/stt/rt/real-time-transcription#audio-formats
            if (audioFormat === "auto") {
              // Set to "auto" to let Soniox detect the audio format automatically.
              config.audio_format = "auto";
            } else if (audioFormat === "pcm_s16le") {
              // Example of a raw audio format; Soniox supports many others as well.
              config.audio_format = "pcm_s16le";
              config.sample_rate = 16000;
              config.num_channels = 1;
            } else {
              throw new Error(`Unsupported audio_format: ${audioFormat}`);
            }

            // Translation options.
            // See: soniox.com/docs/stt/rt/real-time-translation#translation-modes
            if (translation === "one_way") {
              // Translates all languages into the target language.
              config.translation = { type: "one_way", target_language: "es" };
            } else if (translation === "two_way") {
              // Translates from language_a to language_b and back from language_b to language_a.
              config.translation = {
                type: "two_way",
                language_a: "en",
                language_b: "es",
              };
            } else if (translation !== "none") {
              throw new Error(`Unsupported translation: ${translation}`);
            }

            return config;
          }

          // Read the audio file and send its bytes to the websocket.
          async function streamAudio(audioPath, ws) {
            const stream = fs.createReadStream(audioPath, { highWaterMark: 3840 });

            for await (const chunk of stream) {
              ws.send(chunk);
              // Sleep for 120 ms to simulate real-time streaming.
              await new Promise((res) => setTimeout(res, 120));
            }

            // Empty string signals end-of-audio to the server
            ws.send("");
          }

          // Convert tokens into readable transcript
          function renderTokens(finalTokens, nonFinalTokens) {
            let textParts = [];
            let currentSpeaker = null;
            let currentLanguage = null;

            const allTokens = [...finalTokens, ...nonFinalTokens];

            // Process all tokens in order.
            for (const token of allTokens) {
              let { text, speaker, language } = token;
              const isTranslation = token.translation_status === "translation";

              // Speaker changed -> add a speaker tag.
              if (speaker && speaker !== currentSpeaker) {
                if (currentSpeaker !== null) textParts.push("\n\n");
                currentSpeaker = speaker;
                currentLanguage = null; // Reset language on speaker changes.
                textParts.push(`Speaker ${currentSpeaker}:`);
              }

              // Language changed -> add a language or translation tag.
              if (language && language !== currentLanguage) {
                currentLanguage = language;
                const prefix = isTranslation ? "[Translation] " : "";
                textParts.push(`\n${prefix}[${currentLanguage}] `);
                text = text.trimStart();
              }

              textParts.push(text);
            }

            textParts.push("\n===============================");
            return textParts.join("");
          }

          function runSession(apiKey, audioPath, audioFormat, translation) {
            const config = getConfig(apiKey, audioFormat, translation);

            console.log("Connecting to Soniox...");
            const ws = new WebSocket(SONIOX_WEBSOCKET_URL);

            let finalTokens = [];

            ws.on("open", () => {
              // Send first request with config.
              ws.send(JSON.stringify(config));

              // Start streaming audio in the background.
              streamAudio(audioPath, ws).catch((err) =>
                console.error("Audio stream error:", err),
              );
              console.log("Session started.");
            });

            ws.on("message", (msg) => {
              const res = JSON.parse(msg.toString());

              // Error from server.
              // See: https://soniox.com/docs/stt/api-reference/websocket-api#error-response
              if (res.error_code) {
                console.error(`Error: ${res.error_code} - ${res.error_message}`);
                ws.close();
                return;
              }

              // Parse tokens from current response.
              let nonFinalTokens = [];
              if (res.tokens) {
                for (const token of res.tokens) {
                  if (token.text) {
                    if (token.is_final) {
                      // Final tokens are returned once and should be appended to final_tokens.
                      finalTokens.push(token);
                    } else {
                      // Non-final tokens update as more audio arrives; reset them on every response.
                      nonFinalTokens.push(token);
                    }
                  }
                }
              }

              // Render tokens.
              const text = renderTokens(finalTokens, nonFinalTokens);
              console.log(text);

              // Session finished.
              if (res.finished) {
                console.log("Session finished.");
                ws.close();
              }
            });

            ws.on("error", (err) => console.error("WebSocket error:", err));
          }

          async function main() {
            const { values: argv } = parseArgs({
              options: {
                audio_path: { type: "string", required: true },
                audio_format: { type: "string", default: "auto" },
                translation: { type: "string", default: "none" },
              },
            });

            const apiKey = process.env.SONIOX_API_KEY;
            if (!apiKey) {
              throw new Error(
                "Missing SONIOX_API_KEY.\n" +
                  "1. Get your API key at https://console.soniox.com\n" +
                  "2. Run: export SONIOX_API_KEY=<YOUR_API_KEY>",
              );
            }

            runSession(apiKey, argv.audio_path, argv.audio_format, argv.translation);
          }

          main().catch((err) => {
            console.error("Error:", err.message);
            process.exit(1);
          });

          ```
        </FileCodeBlock>
      </Accordion>

      <Accordion title="Run" id="run">
        ```sh title="Terminal"
        # One-way translation of a live audio stream
        node soniox_realtime.js --audio_path ../assets/coffee_shop.mp3 --translation one_way

        # Two-way translation of a live audio stream
        node soniox_realtime.js --audio_path ../assets/two_way_translation.mp3 --translation two_way
        ```
      </Accordion>
    </Accordions>
  </Tab>
</Tabs>

# Endpoint detection
URL: /stt/rt/endpoint-detection

Learn how speech endpoint detection works.

***

title: Endpoint detection
description: Learn how speech endpoint detection works.
-------------------------------------------------------

## Overview

{/*
  Endpoint detection lets you know when a speaker has finished speaking.
  This is critical for real-time voice AI assistants, command-and-response
  systems, and conversational apps where you want to respond **immediately** without
  waiting for long silences.

  When enabled, Soniox automatically detects natural pauses and emits a special `<end>` token at the end of an utterance.

  */}

Endpoint detection lets you know when a speaker has finished speaking. This is
critical for real-time voice AI assistants, command-and-response systems, and
conversational apps where you want to respond immediately without waiting for
long silences.

Unlike traditional endpoint detection based on voice activity detection (VAD),
Soniox uses its speech model itself to listen to intonations, pauses, and
conversational context to determine when an utterance has ended. This makes it
far more advanced — delivering **lower latency, fewer false triggers,** and a
noticeably **smoother product experience.**

***

## How it works

When `enable_endpoint_detection` is **enabled**:

* Soniox monitors pauses in speech to determine the end of an utterance.
* As soon as speech ends:
  * **All preceding tokens** are marked as final.
  * A special `<end>` **token** is returned.
* The `<end>` token:
  * Always appears **once** at the end of the segment.
  * Is **always final**.
  * Can be treated as a reliable signal to trigger downstream logic (e.g., calling an LLM or executing a command).

***

## Enabling endpoint detection

Add the flag in your real-time request:

```json
{
  "enable_endpoint_detection": true
}
```

***

## Example

<h3>User says</h3>

```text
What's the weather in San Francisco?
```

<h3>Soniox stream</h3>

<Steps>
  <Step>
    **Non-final tokens (still being processed)**

    First response arrives:

    ```json
    {"text": "What's",    "is_final": false}
    {"text": "the",       "is_final": false}
    {"text": "weather",   "is_final": false}
    ```

    Second response arrives:

    ```json
    {"text": "What's",    "is_final": false}
    {"text": "the",       "is_final": false}
    {"text": "weather",   "is_final": false}
    {"text": "in",        "is_final": false}
    {"text": "San",       "is_final": false}
    {"text": "Francisco", "is_final": false}
    {"text": "?",         "is_final": false}
    ```
  </Step>

  <Step>
    **Final tokens (endpoint detected, tokens are finalized)**

    ```json
    {"text": "What's",    "is_final": true}
    {"text": "the",       "is_final": true}
    {"text": "weather",   "is_final": true}
    {"text": "in",        "is_final": true}
    {"text": "San",       "is_final": true}
    {"text": "Francisco", "is_final": true}
    {"text": "?",         "is_final": true}
    {"text": "<end>",     "is_final": true}
    ```
  </Step>
</Steps>

<h3>Explanation</h3>

1. **Streaming phase:** tokens are delivered in real-time as the user
   speaks. They are marked `is_final: false`, meaning the transcript is still being
   processed and may change.
2. **Endpoint detection:** once the speaker stops, the model recognizes the end of the utterance.
3. **Finalization phase:** previously non-final tokens are re-emitted with `is_final: true`, followed by the `<end>` token (also final).
4. **Usage tip:** display non-final tokens immediately for live captions, but switch to final tokens once `<end>` arrives before triggering any downstream actions.

# Manual finalization
URL: /stt/rt/manual-finalization

Learn how manual finalization works.

***

title: Manual finalization
description: Learn how manual finalization works.
-------------------------------------------------

import { LuTriangleAlert } from "react-icons/lu";

## Overview

Soniox supports **manual finalization** in addition to automatic mechanisms like
[endpoint detection](/stt/rt/endpoint-detection). Manual finalization
gives you precise control over when audio should be finalized — useful for:

* Push-to-talk systems.
* Client-side voice activity detection (VAD).
* Segment-based transcription pipelines.
* Applications where automatic endpoint detection is not ideal.

***

## How to finalize

Send a control message over the WebSocket connection:

```json
{"type": "finalize"}
```

When received:

* Soniox finalizes all audio up to that point.
* All tokens from that audio are returned with `"is_final": true`.
* The model emits a special marker token:

```json
{"text": "<fin>", "is_final": true}
```

The `<fin>` token signals that finalization is complete.

***

## Key points

* You can call `finalize` multiple times per session.
* You may continue streaming audio after each `finalize` call.
* The `<fin>` token is always returned as final and can be used to trigger downstream processing.
* Do not send `finalize` too frequently (every few seconds is fine; too often may cause disconnections).
* <LuTriangleAlert className="inline text-fd-card align-text-bottom size-6 fill-orange-400" /> You are charged for the **full stream duration,** not just the audio processed.

***

## Trailing silence

If you already added silence before sending finalize, you can reduce extra padding and improve latency by specifying:

```json
{
  "type": "finalize",
  "trailing_silence_ms": 300
}
```

This tells Soniox how much silence you already included.

***

## Connection keepalive

Combine with [connection keepalive](/stt/rt/connection-keepalive): use keepalive messages to prevent timeouts when no audio is being sent (e.g., during long pauses).

# Connection keepalive
URL: /stt/rt/connection-keepalive

Learn how connection keepalive works.

***

title: Connection keepalive
description: Learn how connection keepalive works.
--------------------------------------------------

import { LuTriangleAlert } from "react-icons/lu";

## Overview

In real-time transcription, you may have periods of silence — for example when
using client-side VAD (voice activity detection), during pauses in speech, or
when you intentionally stop streaming audio.

To keep the session alive and preserve context, you must send a **keepalive control message:**

```json
{"type": "keepalive"}
```

This prevents the WebSocket connection from timing out when no audio is being sent.

***

## When to use

Send a keepalive message whenever:

* You only stream audio during speech (client-side VAD).
* You temporarily pause audio streaming but want to keep the session active.

This ensures that:

* The connection stays open.
* Session context (e.g., speaker labels, language tracking, prompt) is preserved.

***

## Key points

* **Send at least once every 20 seconds** when not sending audio.

* You may send more frequently (every 5–10s is common).

* If no keepalive or audio is received for >20s, the connection may be closed.

* <LuTriangleAlert className="inline text-fd-card align-text-bottom size-6 fill-orange-400" /> You are charged for the **full stream duration,** not just the audio processed.

# Limits & quotas
URL: /stt/rt/limits-and-quotas

Learn about real-time API limits and quotas.

***

title: Limits & quotas
description: Learn about real-time API limits and quotas.
---------------------------------------------------------

## WebSocket API limits

Soniox applies limits to real-time WebSocket sessions to ensure stability and fair use.
Make sure your application respects these constraints and implements graceful recovery when a limit is reached.

| Limit               | Value       | Notes                                                                                                                                     |
| ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Requests per minute | 100         | Exceeding this may result in rate limiting                                                                                                |
| Concurrent requests | 10          | Maximum number of simultaneous active WebSocket connections                                                                               |
| Stream duration     | 300 minutes | Each real-time session is capped at 300 minutes. To continue beyond this, open a new session. This limit is fixed and cannot be increased |

You can request higher limits (except for stream duration) in the [Soniox Console](https://console.soniox.com/).

# Error handling
URL: /stt/rt/error-handling

Learn about real-time API error handling.

***

title: Error handling
description: Learn about real-time API error handling.
------------------------------------------------------

In the Soniox Real-time API, all errors are returned as JSON error responses before the
connection is closed. Your application should always log and inspect these
errors to determine the cause.

## Error responses

If an error occurs, Soniox will:

1. Send an error response containing an **error code** and **error message.**
2. Immediately close the WebSocket connection.

Example:

```json
{
  "error_code": 400,
  "error_message": "Invalid model specified."
}
```

Always print out or log the error response to capture both the code and message.

The complete list of error codes and their meanings can be found under [Error codes](/stt/api-reference/websocket-api#error-response).

***

## Request termination

Real-time sessions run on a **best-effort basis.**
While most sessions last until the maximum supported audio duration (see [Limits & quotas](/stt/rt/limits-and-quotas)), early termination may occur.

If a session is closed early, you’ll receive a 503 error:

```text
Cannot continue request (code N). Please restart the request.
```

Your application should:

* Detect this error.
* Immediately start a **new request** to continue streaming.

***

## Real-time cadence

You should send audio data to Soniox **in real-time or near real-time speed.** Small
deviations are tolerated — such as brief buffering or network jitter — but
prolonged bursts or lags may result in disconnection.

# Supported languages
URL: /stt/concepts/supported-languages

List of supported languages by Soniox Speech-to-Text AI.

***

title: Supported languages
description: List of supported languages by Soniox Speech-to-Text AI.
keywords: "soniox supported languages"
--------------------------------------

## Overview

Soniox Speech-to-Text AI supports **transcription and translation in 60+ languages** with world-leading accuracy — all powered by a **single, unified AI model.**

* **Transcription** → Available in every supported language.
* **Translation** → Works between any pair of supported languages.

All languages are available in both:

* **Real-time API** → Stream live audio with transcription + translation.
* **Async API** → Transcribe recorded files at scale.

To programmatically retrieve the full list of supported languages, use the [Get models](/stt/api-reference/models/get_models) endpoint.

For detailed accuracy comparisons, see our [Benchmark Report](https://soniox.com/media/SonioxSTTBenchmarks2025.pdf).

***

## Supported languages

| Language    | ISO Code |
| ----------- | -------- |
| Afrikaans   | af       |
| Albanian    | sq       |
| Arabic      | ar       |
| Azerbaijani | az       |
| Basque      | eu       |
| Belarusian  | be       |
| Bengali     | bn       |
| Bosnian     | bs       |
| Bulgarian   | bg       |
| Catalan     | ca       |
| Chinese     | zh       |
| Croatian    | hr       |
| Czech       | cs       |
| Danish      | da       |
| Dutch       | nl       |
| English     | en       |
| Estonian    | et       |
| Finnish     | fi       |
| French      | fr       |
| Galician    | gl       |
| German      | de       |
| Greek       | el       |
| Gujarati    | gu       |
| Hebrew      | he       |
| Hindi       | hi       |
| Hungarian   | hu       |
| Indonesian  | id       |
| Italian     | it       |
| Japanese    | ja       |
| Kannada     | kn       |
| Kazakh      | kk       |
| Korean      | ko       |
| Latvian     | lv       |
| Lithuanian  | lt       |
| Macedonian  | mk       |
| Malay       | ms       |
| Malayalam   | ml       |
| Marathi     | mr       |
| Norwegian   | no       |
| Persian     | fa       |
| Polish      | pl       |
| Portuguese  | pt       |
| Punjabi     | pa       |
| Romanian    | ro       |
| Russian     | ru       |
| Serbian     | sr       |
| Slovak      | sk       |
| Slovenian   | sl       |
| Spanish     | es       |
| Swahili     | sw       |
| Swedish     | sv       |
| Tagalog     | tl       |
| Tamil       | ta       |
| Telugu      | te       |
| Thai        | th       |
| Turkish     | tr       |
| Ukrainian   | uk       |
| Urdu        | ur       |
| Vietnamese  | vi       |
| Welsh       | cy       |


# Language hints
URL: /stt/concepts/language-hints

Learn about supported languages and how to specify language hints.

***

title: Language hints
description: Learn about supported languages and how to specify language hints.
keywords: "soniox language hints"
---------------------------------

## Overview

Soniox Speech-to-Text AI is a powerful, multilingual model that transcribes
speech in **60+ languages** with world-leading accuracy.

By default, you don’t need to pre-select a language — the model automatically
detects and transcribes any supported language. It also handles **multilingual
speech seamlessly,** even when multiple languages are mixed within a single
sentence or conversation.

When you already know which languages are most likely to appear in your audio,
you **should provide language hints** to guide the model. This **improves accuracy** by
biasing recognition toward the specified languages, while still allowing other
languages to be detected if present.

***

## How language hints work

* Use the `language_hints` parameter to provide a list of expected **ISO language codes** (e.g., `en` for English, `es` for Spanish).
* Language hints **do not restrict** recognition to those languages — they only **bias** the model toward them.

**Example: Hinting English and Spanish**

```json
{
  "language_hints": ["en", "es"]
}
```

This biases transcription toward **English** and **Spanish,** while still allowing other languages to be detected if spoken.

***

## When to use language hints

Provide `language_hints` when:

* You know or expect certain languages in the audio.
* You want to improve accuracy for specific languages.
* Audio includes **uncommon** or **similar-sounding** languages.
* You’re transcribing content for a **specific audience or market.**

***

## Supported languages

See the list of [supported languages](/stt/concepts/supported-languages) and their ISO codes.

# Language restrictions
URL: /stt/concepts/language-restrictions

Learn about supported languages and how to specify language hints.

***

title: Language restrictions
description: Learn about supported languages and how to specify language hints.
keywords: "soniox language hints"
---------------------------------

## Overview

Soniox Speech-to-Text AI supports **restricting recognition to specific languages**. This is useful when your application expects speech in a known language and you want to **avoid accidental transcription in other languages**, especially in cases of heavy accents or ambiguous pronunciation.

Language restriction is **best-effort, not a hard guarantee**. While the model is strongly biased toward the specified languages, it may still occasionally output another language in rare edge cases. In practice, this happens very infrequently when configured correctly.

***

## How language restrictions work

Language restriction is enabled using two parameters:

* `language_hints`<br />
  A list of expected spoken languages, provided as ISO language codes (e.g. `en` for English, `es` for Spanish).
* `language_hints_strict`<br />
  A boolean flag that enables language restriction based on the provided hints.

When `language_hints_strict` is set to `true`, the model will strongly prefer producing output **only in the specified languages**.

<Callout type="warn">
  Best results are achieved when specifying a single language.
</Callout>

***

## Recommended usage

### ✅ Use a single language whenever possible

Language restriction is most robust when **only one language** is provided. This is strongly recommended for production use.

For example, restricting to English only:

```json
{
  "language_hints": ["en"],
  "language_hints_strict": true
}
```

### ⚠️ Multiple languages reduce robustness

You may specify multiple languages, but accuracy can degrade when language identification becomes ambiguous, especially with heavy accents or acoustically similar languages.

Example (English + Spanish):

```json
{
  "language_hints": ["en", "es"],
  "language_hints_strict": true
}
```

In difficult cases (e.g. heavily accented English spoken by a Hindi speaker), the model may still choose the “wrong” language and transcribe using the wrong script. This is why **single-language restriction is strongly recommended** when correctness is critical.

***

## When to use language restrictions

Use language restriction when:

* Your application expects **only one known language**
* You want to **avoid transliteration into the wrong alphabet**
* You want **higher accuracy** than using `language_hints` alone
* You are processing speech with **strong accents**

Language restriction provides a stronger signal than language hints without restriction.

***

## Language identification behavior

Automatic language identification is still technically active when language restriction is enabled. However:

**Language restriction is intended for cases where the spoken language is already known.**

If you need full automatic language detection across many languages, do not enable strict language restriction.

***

## Supported languages

See the full list of supported languages and their ISO codes in the [supported languages](/stt/concepts/supported-languages) section.

***

## Supported models

Language restriction is supported on:

* `stt-rt-v3`

# Language identification
URL: /stt/concepts/language-identification

Learn how to identify one or more spoken languages within an audio.

***

title: Language identification
description: Learn how to identify one or more spoken languages within an audio.
--------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI can **automatically identify spoken languages** within an
audio stream — whether the speech is entirely in one language or mixes multiple
languages. This lets you handle **real-world multilingual conversations** naturally
and accurately, without requiring users to specify languages in advance.

***

## How it works

Language identification in Soniox is performed **at the token level.** Each token
in the transcript is tagged with a language code. However, the model is trained
to maintain **sentence-level coherence,** not just word-level decisions.

***

### Examples

**Example 1: embedded foreign word**

```json
[en] Hello, my dear amigo, how are you doing?
```

All tokens are labeled as English (`en`), even though “amigo” is Spanish.

**Example 2: distinct sentences in multiple languages**

```json
[en] How are you?
[de] Guten Morgen!
[es] Cómo está everyone?
[en] Great! Let’s begin with the agenda.
```

Here, language tags align with sentence boundaries, making the transcript easier to read and interpret in multilingual conversations.

***

## Enabling language identification

Enable automatic language identification by setting the flag in your request:

```json
{
  "enable_language_identification": true
}
```

***

## Output format

When enabled, each token includes a language field alongside the text:

```json
{"text": "How",     "language": "en"}
{"text": " are",    "language": "en"}
{"text": " you",    "language": "en"}
{"text": "?",       "language": "en"}
{"text": "Gu",      "language": "de"}
{"text": "ten",     "language": "de"}
{"text": " Morgen", "language": "de"}
{"text": "!",       "language": "de"}
{"text": "Cómo",    "language": "es"}
{"text": " está",   "language": "es"}
{"text": " every",  "language": "es"}
{"text": "one",     "language": "es"}
{"text": "?",       "language": "es"}
```

***

## Language hints

Use [Language hints](/stt/concepts/language-hints) whenever possible to improve the accuracy of language identification.

***

## Real-time considerations

Language identification in **real-time** is more challenging due to
low-latency constraints. The model has less context available, which may cause:

* Temporary misclassification of language.
* Language tags being **revised** as more speech context arrives.

Despite this, Soniox provides highly reliable detection of language switches in real-time.

***

## Supported languages

Language identification is available for all [supported languages](/stt/concepts/supported-languages).


# Speaker diarization
URL: /stt/concepts/speaker-diarization

Learn how to separate speakers in both real-time and asynchronous processing.

***

title: Speaker diarization
description: Learn how to separate speakers in both real-time and asynchronous processing.
keywords: "speaker recognition, speaker diarization, speaker identification, separate speakers, identify speakers, speaker separation"
--------------------------------------------------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI supports **speaker diarization** — the ability to
automatically detect and separate speakers in an audio stream. This allows you
to generate **speaker-labeled transcripts** for conversations, meetings, interviews,
podcasts, and other multi-speaker scenarios — without any manual labeling or
extra metadata.

***

## What is speaker diarization?

Speaker diarization answers the question: **Who spoke when?**

When enabled, Soniox automatically detects speaker changes and assigns each
spoken segment to a speaker label (e.g., `Speaker 1`, `Speaker 2`). This lets you
structure transcripts into clear, speaker-attributed sections.

### Example

Input audio:

```text
How are you? I am fantastic. What about you? Feeling great today. Hey everyone!
```

Output with diarization enabled:

```text
Speaker 1: How are you?
Speaker 2: I am fantastic. What about you?
Speaker 1: Feeling great today.
Speaker 3: Hey everyone!
```

***

## How to enable speaker diarization

Enable diarization by setting this parameter in your API request:

```json
{
  "enable_speaker_diarization": true
}
```

***

## Output format

When speaker diarization is enabled, each token includes a `speaker` field:

```json
{"text": "How",    "speaker": "1"}
{"text": " are",   "speaker": "1"}
{"text": " you",   "speaker": "1"}
{"text": "?",      "speaker": "1"}
{"text": "I",      "speaker": "2"}
{"text": " am",    "speaker": "2"}
{"text": " fan",   "speaker": "2"}
{"text": "tastic", "speaker": "2"}
{"text": ".",      "speaker": "2"}
```

You can group tokens by speaker in your application to create readable segments, or display speaker labels directly in your UI.

***

## Real-time considerations

Real-time speaker diarization is more challenging due to low-latency constraints. You may observe:

* Higher speaker attribution errors compared to async mode.
* Temporary speaker switches that stabilize as more context is available.

Even with these limitations, real-time diarization is valuable for
**live meetings, conferences, customer support calls, and conversational AI
interfaces.**

***

## Number of supported speakers

* Up to **15 different speakers** are supported per transcription session.
* Accuracy may decrease when many speakers have **similar voice characteristics.**

***

## Best practice

For the most accurate and reliable speaker separation, use **asynchronous
transcription** — it provides significantly higher diarization accuracy because
the model has access to the full audio context. Real-time diarization is best
when you need immediate speaker attribution, but expect lower accuracy due to
low-latency constraints.

***

## Supported languages

Speaker diarization is available for all [supported languages](/stt/concepts/supported-languages).


# Context
URL: /stt/concepts/context

Learn how to use custom context to enhance trancription accuracy.

***

title: Context
description: Learn how to use custom context to enhance trancription accuracy.
keywords: "speech to text customization, stt custom words, transcribe with custom vocabulary"
---------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI lets you improve both **transcription** and
**translation** accuracy by providing **context** with each session.

Context helps the model **understand your domain**, **recognize important terms**,
and apply **custom vocabulary** and **translation preferences**.

Think of it as giving the model **your world** —
what the conversation is about, which words are important, and how certain terms should be translated.

***

## Context sections

You provide context through the `context` object that can include up to **four sections**,
each improving accuracy in different ways:

| Section             | Type                  | Description                                                    |
| ------------------- | --------------------- | -------------------------------------------------------------- |
| `general`           | array of JSON objects | Structured key-value information (domain, topic, intent, etc.) |
| `text`              | string                | Longer free-form background text or related documents          |
| `terms`             | array of strings      | Domain-specific or uncommon words                              |
| `translation_terms` | array of JSON objects | Custom translations for ambiguous terms                        |

All sections are optional — include only what's relevant for your use case.

### General

General information provides **baseline context** which guides the AI model.
It helps the model adapt its vocabulary to the correct domain, improving **transcription** and
**translation** quality and clarifying ambiguous words.

It consists of structured **key-value pairs** describing the conversation **domain**, **topic**, **intent**, and other
relevant metadata such as participant's names, organization, setting, location, etc.

#### Example

```json
{
  "context": {
    "general": [
      { "key": "domain",       "value": "Healthcare" },
      { "key": "topic",        "value": "Diabetes management consultation" },
      { "key": "doctor",       "value": "Dr. Martha Smith" },
      { "key": "patient",      "value": "Mr. David Miller" },
      { "key": "organization", "value": "St John's Hospital" }
    ]
  }
}
```

### Text

Provide longer unstructured text that expands on general information — examples include:

* History of prior interactions with a customer.
* Reference documents.
* Background summaries.
* Meeting notes.

#### Example

```json
{
  "context": {
    "text": "The customer, Maria Lopez, contacted BrightWay Insurance to update
    her auto policy after purchasing a new vehicle. Agent Daniel Kim reviewed the
    changes, explained the premium adjustment, and offered a bundling discount.
    Maria agreed to update the policy and scheduled a follow-up to consider
    additional options."
  }
}
```

### Transcription terms

Improve transcription accuracy of important or uncommon words and phrases
that you expect in the audio — such as:

* Domain or industry-specific terminology.
* Brand or product names.
* Rare, uncommon, or invented words.

#### Example

```json
{
  "context": {
    "terms": [
      "Celebrex", 
      "Zyrtec", 
      "Xanax",
      "Prilosec", 
      "Amoxicillin Clavulanate Potassium"
    ]
  }
}
```

### Translation terms

Control how specific words or phrases are translated — useful for:

* Technical terminology.
* Entity names.
* Words with ambiguous domain-specific translations.
* Idioms and figurative speech with non-literal meaning.

#### Example for English → Spanish translation

```json
{
  "context": {
    "translation_terms": [
      { "source": "Mr. Smith", "target": "Sr. Smith" },
      { "source": "MRI",       "target": "RM" },
      { "source": "St John's", "target": "St John's" },
      { "source": "stroke",    "target": "ictus" }
    ]
  }
}
```

***

## Tips

* Provide domain and topic in the `general` section for best accuracy.
* Keep `general` short — ideally no more than **10** key-value pairs.
* Use `terms` to ensure consistent spelling and casing of difficult entity names.
* Use `translations` to preserve terms like names or brands unchanged, e.g., `"St John's"` → `"St John's"`.

***

## Context size limit

* Maximum **8,000 tokens** (\~10,000 characters).
* Supports large blocks of text: glossaries, scripts, domain summaries.
* If you exceed the limit, the API will return an error → trim or summarize first.


# Timestamps
URL: /stt/concepts/timestamps

Learn how to use timestamps and understand their granularity.

***

title: Timestamps
description: Learn how to use timestamps and understand their granularity.
keywords: "speech to text timestamps, speech to text time, speech to text word times, stt token timestamps"
-----------------------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI provides **precise timestamps** for every recognized token (word or sub-word).
Timestamps let you align transcriptions with audio, so you know exactly when each word was spoken.

**Timestamps are always included** by default — no extra configuration needed.

***

## Output format

Each token in the response includes:

* `text` → The recognized token.
* `start_ms` → Token start time (in milliseconds).
* `end_ms` → Token end time (in milliseconds).

***

## Example response

In this example, the word **“Beautiful”** is split into three tokens, each with its own timestamp range:

```json
{
  "tokens": [
    {"text": "Beau", "start_ms": 300, "end_ms": 420},
    {"text": "ti",   "start_ms": 420, "end_ms": 540},
    {"text": "ful",  "start_ms": 540, "end_ms": 780}
  ]
}
```


# Confidence scores
URL: /stt/concepts/confidence-scores

Learn how to use confidence score of recognized tokens.

***

title: Confidence scores
description: Learn how to use confidence score of recognized tokens.
keywords: "transcription confidence score, transcription accuracy, audio model confidence"
------------------------------------------------------------------------------------------

## Overview

Soniox Speech-to-Text AI provides a **confidence score** for every recognized token (word or sub-word) in the transcript.
The confidence score represents the model’s estimate of how likely the token was recognized correctly.

Confidence values are floating-point numbers between **0.0** and **1.0**:

* **1.0** → very high confidence.
* **0.0** → very low confidence.

Low confidence values typically occur when recognition is uncertain due to factors like background noise, heavy accents, unclear speech, or uncommon vocabulary.

You can use confidence scores to:

* Assess overall transcription quality.
* Flag or highlight uncertain words in a transcript.
* Trigger post-processing, e.g., request user confirmation or re-check with additional context.

**Confidence scores are always included** by default — no extra configuration needed.

***

## Output format

Each token in the API response includes:

* `text` → the recognized token.
* `confidence` → the confidence score for that token.

***

## Example response

In this example, the word **“Beautiful”** is split into three tokens, each with its own confidence score:

```json
{
  "tokens": [
    {"text": "Beau", "confidence": 0.82},
    {"text": "ti",   "confidence": 0.87},
    {"text": "ful",  "confidence": 0.98}
  ]
}
```


# Models
URL: /stt/models

Learn about latest models, changelog, and deprecations.

***

title: Models
description: Learn about latest models, changelog, and deprecations.
--------------------------------------------------------------------

Soniox Speech-to-Text **AI** provides multiple models for real-time and asynchronous
transcription and translation. This page lists the currently available models,
their capabilities, and important updates.

***

## Current models

{/*TABLE START */}

{/* NOTE(miha): Width is set so that we have maximum of 2 lines in 'Example' column. */}

{/* NOTE(miha): Font size is set so the table doesn't look "too big".*/}

<div>
  | <div style={{ width: "150px" }}>Model </div> | {" "} <div style={{ width: "70px" }}>Type</div> | Status     |
  | -------------------------------------------- | ----------------------------------------------- | ---------- |
  | **stt-rt-v3**                                | Real-time                                       | **Active** |
  | **stt-async-v3**                             | Async                                           | **Active** |
</div>

{/* TABLE END */}

***

## Aliases

Aliases provide a stable reference so you don’t need to change your code when newer versions are released.

| Alias                    | Points to      | Notes                                              |
| ------------------------ | -------------- | -------------------------------------------------- |
| **stt-rt-v3-preview**    | `stt-rt-v3`    | Always points to the latest real-time active model |
| **stt-rt-preview-v2**    | `stt-rt-v3`    |                                                    |
| **stt-async-preview-v1** | `stt-async-v3` |                                                    |

***

## Changelog

### October 31, 2025

#### Model retirement and upgrade

We have accelerated the retirement of older models following the overwhelmingly positive response to the new v3 models. The following models have been retired:

* stt-async-preview-v1
* stt-rt-preview-v2

Both models have been **aliased to the new Soniox v3 models.**
This means all existing requests using the old model names are now automatically served with v3, giving every user our most accurate, capable, and intelligent voice AI experience, without any code changes required.

#### Context compatibility

The context feature is now backward compatible with v3 models, ensuring smooth migration from older versions. However, we **strongly recommend updating to the new context** structure for best results and future flexibility. Learn more about [context](/stt/concepts/context).

### October 29, 2025

**Model update:** v3 enhancements

**Applies to:** stt-rt-v3, stt-async-v3

#### New features

* **Extended audio duration support:** both real-time (stt-rt-v3) and asynchronous (stt-async-v3) models now support **audio up to 5 hours** in a single request.

#### Quality improvements

* **Higher transcription accuracy** across challenging audio conditions and diverse languages.

#### Notes

* No API changes are required; existing integrations continue to work seamlessly.
* For asynchronous processing, large files up to 5 hours can now be uploaded directly without chunking.
* For real-time streaming, sessions up to 5 hours are supported under the same WebSocket connection.

### October 21, 2025

**New models:** stt-rt-v3, stt-async-v3

**Replaces:** stt-rt-preview-v2, stt-async-preview-v1

#### Overview

The **v3 models** introduce major improvements across recognition, translation, and reasoning — making Soniox faster, more accurate, and more capable than ever before.

These models power real-time and asynchronous speech processing in 60+ languages, with enhanced accuracy, robustness, and context understanding.

#### Key improvements

* Higher transcription accuracy across 60+ languages
* Improved multilingual switching — seamless recognition when speakers change language mid-sentence
* Significantly higher translation quality, especially for languages such as German and Korean
* The async model now also supports translation
* Support for new advanced structured context, enabling richer domain- and task-specific adaptation
* Enhanced alphanumeric accuracy (addresses, IDs, codes, serials)
* More accurate speaker diarization, even in overlapping speech
* Extended maximum audio duration to 5 hours for both async and real-time models

#### API compatibility

* The v3 models are fully compatible with the existing Soniox API, if you are not using the context feature.
* To upgrade, simply replace the model name in your API request:
  * `{ "model": "stt-rt-v3" }` for real-time
  * `{ "model": "stt-async-v3" }` for async
* If you are using the context feature, update to the new structured [context](/stt/concepts/context) for improved accuracy.

#### Deprecation notice

The following preview models are **deprecated** and will be retired on **November 30, 2025:**

* stt-async-preview-v1
* stt-rt-preview-v2

Please migrate to the v3 models before that date to ensure uninterrupted service.

### August 15, 2025

* Deprecated `stt-rt-preview-v1`

### August 5, 2025

* Released `stt-rt-preview-v2`
  * Higher transcription accuracy
  * Improved translation quality
  * Expanded to support all translation pairs
  * More reliable automatic language switching
  * **Replaces:** stt-rt-preview-v2, stt-async-preview-v1


# WebSocket API
URL: /stt/api-reference/websocket-api

Learn how to use and integrate Soniox Speech-to-Text WebSocket API.

***

title: WebSocket API
description: Learn how to use and integrate Soniox Speech-to-Text WebSocket API.
keywords: "transcribe over websockets, speech to text websocket api, multilingual speech-to-text websocket api"
---------------------------------------------------------------------------------------------------------------

import { Badge } from "@openapi/ui/components/method-label";

## Overview

The **Soniox WebSocket API** provides real-time **transcription and translation** of
live audio with ultra-low latency. It supports advanced features like **speaker
diarization, context customization,** and **manual finalization** — all over a
persistent WebSocket connection. Ideal for live scenarios such as meetings,
broadcasts, multilingual communication, and voice interfaces.

***

## WebSocket endpoint

Connect to the API using:

```text
wss://stt-rt.soniox.com/transcribe-websocket
```

***

## Configuration

Before streaming audio, configure the transcription session by sending a JSON message such as:

```json
{
  "api_key": "<SONIOX_API_KEY|SONIOX_TEMPORARY_API_KEY>",
  "model": "stt-rt-preview",
  "audio_format": "auto",
  "language_hints": ["en", "es"],
  "context": {
    "general": [
      { "key": "domain", "value": "Healthcare" },
      { "key": "topic", "value": "Diabetes management consultation" },
      { "key": "doctor", "value": "Dr. Martha Smith" },
      { "key": "patient", "value": "Mr. David Miller" },
      { "key": "organization", "value": "St John's Hospital" }
    ],
    "text": "Mr. David Miller visited his healthcare provider last month for a routine follow-up related to diabetes care. The clinician reviewed his recent test results, noted improved glucose levels, and adjusted his medication schedule accordingly. They also discussed meal planning strategies and scheduled the next check-up for early spring.",
    "terms": [
      "Celebrex",
      "Zyrtec",
      "Xanax",
      "Prilosec",
      "Amoxicillin Clavulanate Potassium"
    ],
    "translation_terms": [
      { "source": "Mr. Smith", "target": "Sr. Smith" },
      { "source": "St John's", "target": "St John's" },
      { "source": "stroke", "target": "ictus" }
    ]
  },
  "enable_speaker_diarization": true,
  "enable_language_identification": true,
  "translation": {
    "type": "two_way",
    "language_a": "en",
    "language_b": "es"
  }
}
```

***

### Parameters

<ApiParams>
  <ApiParam name="api_key" type="string" required>
    Your Soniox API key. Create API keys in the [Soniox Console](https://console.soniox.com/). For client apps,
    generate a [temporary API](/stt/api-reference/auth/create_temporary_api_key)
    key from your server to keep secrets secure.
  </ApiParam>

  <ApiParam name="model" type="string" required>
    Real-time model to use. See [models](/stt/models).

    <div className="flex flex-col gap-2">
      <span>Example: `"stt-rt-preview"`</span>
    </div>
  </ApiParam>

  <ApiParam name="audio_format" type="string" required>
    Audio format of the stream. See [audio
    formats](/stt/rt/real-time-transcription#audio-formats).
  </ApiParam>

  <ApiParam name="num_channels" type="number">
    Required for raw audio formats. See [audio
    formats](/stt/rt/real-time-transcription#audio-formats).
  </ApiParam>

  <ApiParam name="sample_rate" type="number">
    Required for raw audio formats. See [audio
    formats](/stt/rt/real-time-transcription#audio-formats).
  </ApiParam>

  <ApiParam name="language_hints" type="array<string>">
    See [language hints](/stt/concepts/language-hints).
  </ApiParam>

  <ApiParam name="language_hints_strict" type="bool">
    See [language restrictions](/stt/concepts/language-restrictions).
  </ApiParam>

  <ApiParam name="context" type="object">
    See [context](/stt/concepts/context).
  </ApiParam>

  <ApiParam name="enable_speaker_diarization" type="boolean">
    See [speaker diarization](/stt/concepts/speaker-diarization).
  </ApiParam>

  <ApiParam name="enable_language_identification" type="boolean">
    See [language identification](/stt/concepts/language-identification).
  </ApiParam>

  <ApiParam name="enable_endpoint_detection" type="boolean">
    See [endpoint detection](/stt/rt/endpoint-detection).
  </ApiParam>

  <ApiParam name="client_reference_id" type="string">
    Optional identifier to track this request (client-defined).
  </ApiParam>

  <ApiParam name="translation" type="object">
    See [real-time translation](/stt/rt/real-time-translation).

    <ApiParams>
      <p style={{marginBottom: 0}}>**One-way translation**</p>

      <ApiParam name="type" type="string" required>
        Must be set to `one_way`.
      </ApiParam>

      <ApiParam name="target_language" type="string" required>
        Language to translate the transcript into.
      </ApiParam>
    </ApiParams>

    <ApiParams>
      <p style={{marginTop: "1em", marginBottom: 0}}>**Two-way translation**</p>

      <ApiParam name="type" type="string" required>
        Must be set to `two_way`.
      </ApiParam>

      <ApiParam name="language_a" type="string" required>
        First language for two-way translation.
      </ApiParam>

      <ApiParam name="language_b" type="string" required>
        Second language for two-way translation.
      </ApiParam>
    </ApiParams>
  </ApiParam>
</ApiParams>

***

## Audio streaming

After configuration, start streaming audio:

* Send audio as binary WebSocket frames.
* Each stream supports up to 300 minutes of audio.

***

## Ending the stream

To gracefully close a streaming session:

* Send an **empty WebSocket frame** (binary or text).
* The server will return one or more responses, including [finished response](#finished-response), and then close the connection.

***

## Response

Soniox returns **responses** in JSON format. A typical successful response looks like:

```json
{
  "tokens": [
    {
      "text": "Hello",
      "start_ms": 600,
      "end_ms": 760,
      "confidence": 0.97,
      "is_final": true,
      "speaker": "1"
    }
  ],
  "final_audio_proc_ms": 760,
  "total_audio_proc_ms": 880
}
```

### Field descriptions

<ApiParams>
  <ApiParam name="tokens" type="array<object>">
    List of processed tokens (words or subwords).

    Each token may include:

    <ApiParams>
      <ApiParam name="text" type="string">
        Token text.
      </ApiParam>

      <ApiParam name="start_ms" type="number" optional>
        Start timestamp of the token (in milliseconds). Not included if `translation_status` is `translation`.
      </ApiParam>

      <ApiParam name="end_ms" type="number" optional>
        End timestamp of the token (in milliseconds). Not included if `translation_status` is `translation`.
      </ApiParam>

      <ApiParam name="confidence" type="number">
        Confidence score (`0.0`–`1.0`).
      </ApiParam>

      <ApiParam name="is_final" type="boolean">
        Whether the token is finalized.
      </ApiParam>

      <ApiParam name="speaker" type="string" optional>
        Speaker label (if diarization enabled).
      </ApiParam>

      <ApiParam name="translation_status" type="string" optional>
        See [real-time translation](/stt/rt/real-time-translation).
      </ApiParam>

      <ApiParam name="language" type="string" optional>
        Language of the `token.text`.
      </ApiParam>

      <ApiParam name="source_language" type="string" optional>
        See [real-time translation](/stt/rt/real-time-translation).
      </ApiParam>
    </ApiParams>
  </ApiParam>

  <ApiParam name="final_audio_proc_ms" type="number">
    Audio processed into final tokens.
  </ApiParam>

  <ApiParam name="total_audio_proc_ms" type="number">
    Audio processed into final + non-final tokens.
  </ApiParam>
</ApiParams>

***

## Finished response

At the end of a stream, Soniox sends a **final message** to indicate the session is complete:

```json
{
  "tokens": [],
  "final_audio_proc_ms": 1560,
  "total_audio_proc_ms": 1680,
  "finished": true
}
```

After this, the server closes the WebSocket connection.

***

## Error response

If an error occurs, the server returns an **error message** and immediately closes the connection:

```json
{
  "tokens": [],
  "error_code": 503,
  "error_message": "Cannot continue request (code N). Please restart the request. ..."
}
```

<ApiParams>
  <ApiParam name="error_code" type="number">
    Standard HTTP status code.
  </ApiParam>

  <ApiParam name="error_message" type="string">
    A description of the error encountered.
  </ApiParam>
</ApiParams>

Full list of possible error codes and messages:

<Accordions className="text-sm">
  <Accordion
    id="400"
    title={
<>
  <Badge color="red">400</Badge>
  Bad request
</>
}
  >
    The request is malformed or contains invalid parameters.

    * `Audio data channels must be specified for PCM formats`
    * `Audio data sample rate must be specified for PCM formats`
    * `Audio decode error`
    * `Audio is too long.`
    * `Client reference ID is too long (max length 256)`
    * `Context is too long (max length 10000).`
    * `Control request invalid type.`
    * `Control request is malformed.`
    * `Invalid audio data format: avi`
    * `Invalid base64.`
    * `Invalid language hint.`
    * `Invalid model specified.`
    * `Invalid translation target language.`
    * `Language hints must be unique.`
    * `Missing audio format. Specify a valid audio format (e.g. s16le, f32le, wav, ogg, flac...) or "auto" for auto format detection.`
    * `Model does not support translations.`
    * `No audio received.`
    * `Prompt too long for model`
    * `Received too much audio data in total.`
    * `Start request is malformed.`
    * `Start request must be a text message.`
  </Accordion>

  <Accordion
    id="401"
    title={
<>
  <Badge color="red">401</Badge>
  Unauthorized
</>
}
  >
    Authentication is missing or incorrect. Ensure a valid API key is provided before retrying.

    * `Invalid API key.`
    * `Invalid/expired temporary API key.`
    * `Missing API key.`
  </Accordion>

  <Accordion
    id="402"
    title={
<>
  <Badge color="red">402</Badge>
  Payment required
</>
}
  >
    The organization's balance or monthly usage limit has been reached.
    Additional credits are required before making further requests.

    * `Organization balance exhausted. Please either add funds manually or enable autopay.`
    * `Organization monthly budget exhausted. Please increase it.`
    * `Project monthly budget exhausted. Please increase it.`
  </Accordion>

  <Accordion
    id="408"
    title={
<>
  <Badge color="red">408</Badge>
  Request timeout
</>
}
  >
    The client did not send a start message or sufficient audio data within the required timeframe.
    The connection was closed due to inactivity.

    * `Audio data decode timeout`
    * `Input too slow`
    * `Request timeout.`
    * `Start request timeout`
    * `Timed out while waiting for the first audio chunk`
  </Accordion>

  <Accordion
    id="429"
    title={
<>
  <Badge color="red">429</Badge>
  Too many requests
</>
}
  >
    A usage or rate limit has been exceeded. You may retry after a delay or request
    an increase in limits via the Soniox Console.

    * `Rate limit for your organization has been exceeded.`
    * `Rate limit for your project has been exceeded.`
    * `Your organization has exceeded max number of concurrent requests.`
    * `Your project has exceeded max number of concurrent requests.`
  </Accordion>

  <Accordion
    id="500"
    title={
<>
  <Badge color="red">500</Badge>
  Internal server error
</>
}
  >
    An unexpected server-side error occurred. The request may be retried.

    * `The server had an error processing your request. Sorry about that! You can retry your request, or contact us through our support email support@soniox.com if you keep seeing this error.`
  </Accordion>

  <Accordion
    id="503"
    title={
<>
  <Badge color="red">503</Badge>
  Service unavailable
</>
}
  >
    Cannot continue request or accept new requests.

    * `Cannot continue request (code N). Please restart the request. Refer to: https://soniox.com/url/cannot-continue-request`
  </Accordion>
</Accordions>

