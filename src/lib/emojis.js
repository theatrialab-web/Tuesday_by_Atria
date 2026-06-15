// Set de emojis (recortado a los mas usados) organizado por categorias.
// Menos nodos = la creacion de workspaces y el picker abren mas rapido.
export const EMOJI_GROUPS = [
  {
    name: 'Caras',
    list: '😀 😄 😁 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 🤔 😅 😉 🙂 🙃 😴 😭 😢 😡 🤬 😱 😬 🙄 😏 😌 🤯 🥺 😇 🤗 🤫 🤓 😷 🤒 🤮 🥶 🥵 😈 💀 🤡 👻 👽 🤖'.split(' '),
  },
  {
    name: 'Gestos',
    list: '👋 👌 ✌️ 🤞 🤟 🤙 👈 👉 👆 👇 👍 👎 ✊ 👊 👏 🙌 🫶 🙏 🤝 💪 ✍️ 🤳 👀 🧠 💁 🙋 🤦 🤷 🚶 🏃 💃 🕺 🧘'.split(' '),
  },
  {
    name: 'Personas',
    list: '🧑 👶 👦 👧 👨 👩 🧓 👮 🕵️ 👷 🤴 👸 🦸 🦹 🧙 🧚 🧛 🎅 🤶'.split(' '),
  },
  {
    name: 'Animales',
    list: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🦆 🦅 🦉 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐢 🐍 🐙 🦑 🦐 🦀 🐠 🐟 🐬 🐳 🦈 🐊 🐘 🦒 🐪 🐫 🐕 🐈 🦓 🦍'.split(' '),
  },
  {
    name: 'Naturaleza',
    list: '🌵 🎄 🌲 🌳 🌴 🌱 🌿 ☘️ 🍀 🍃 🍂 🍁 🍄 🌷 🌹 🌺 🌸 🌼 🌻 💐 🌙 ⭐ 🌟 ✨ ⚡ 🔥 🌈 ☀️ ⛅ ☁️ 🌧️ ⛈️ ❄️ ☃️ 💧 🌊'.split(' '),
  },
  {
    name: 'Comida',
    list: '🍏 🍎 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥝 🍅 🥑 🌽 🥕 🥔 🍞 🧀 🥚 🍳 🥓 🍔 🍟 🍕 🌭 🌮 🌯 🥗 🍝 🍜 🍣 🍱 🍙 🍚 🍰 🎂 🧁 🍦 🍩 🍪 🍫 🍬 🍿 ☕ 🍵 🥤 🍺 🍻 🥂 🍷 🍸'.split(' '),
  },
  {
    name: 'Actividad',
    list: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥅 ⛳ 🏆 🥇 🥈 🥉 🏅 🎯 🎮 🎲 🎸 🎹 🎺 🎷 🥁 🎤 🎧 🎬 🎨 🎭 🎪 🎟️ 🎫'.split(' '),
  },
  {
    name: 'Viajes',
    list: '🚗 🚕 🚙 🚌 🏎️ 🚓 🚑 🚒 🚜 🏍️ 🚲 ✈️ 🚀 🚁 ⛵ 🚤 🚢 ⚓ 🗺️ 🗽 🗼 🏰 🎡 🎢 🏖️ 🏝️ 🌋 ⛰️ 🏔️ 🏕️ ⛺ 🏠 🏡 🏢 🏥 🏦 🏨 🏪 🏫 ⛪ 🌃 🌆 🌉 🎆 🎇'.split(' '),
  },
  {
    name: 'Objetos',
    list: '⌚ 📱 💻 ⌨️ 🖥️ 🖨️ 📷 📸 🎥 📞 📺 📻 🔋 🔌 💡 🔦 💸 💵 💰 💳 💎 🔧 🔨 🛠️ ⚙️ 🧲 🔫 💣 🔪 🔮 💊 💉 🩺 🚿 🛁 🔑 🚪 🛏️ 🛋️ 🎁 🎈 🎀 ✉️ 📦 📅 📆 📌 📍 ✂️ 📝 ✏️ 🔍 🔒 🔓'.split(' '),
  },
  {
    name: 'Simbolos',
    list: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💯 💢 ✅ ❌ ⭕ 🛑 ⚠️ 🚫 ❗ ❓ ♻️ 🔰 🆕 🆒 🆓 🔝 ✔️ ➕ ➖ ➗ ✖️ ♾️ 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🔶 🔷 🔸 🔹'.split(' '),
  },
]

export const EMOJIS = EMOJI_GROUPS.flatMap(g => g.list)
