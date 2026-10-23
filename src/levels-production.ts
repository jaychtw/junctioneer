import { authored } from "./authoring";
export const productionLevels = [
  authored({
    number: 4,
    size: 5,
    name: ["Around We Go", "繞呀繞"],
    hint: [
      "A familiar rail is not a failure. But a route that repeats its whole state will go round forever. Find the exit.",
      "經過熟悉的鐵軌不代表失敗。但完整狀態不斷重複，就會永遠繞圈。找出出口吧。",
    ],
    rationale:
      "A real reversible cycle with a selectable escape. Starting heading is internal and explicit; the wrong setting has a solver-detected nonproductive loop.",
    paths: [
      [
        [1, 1],
        [3, 1],
        [3, 2],
        [1, 2],
        [1, 1],
      ],
      [
        [1, 1],
        [0, 1],
      ],
    ],
    start: { at: [2, 1], exit: "W" },
    destination: [0, 1],
    junctions: [
      { id: "J1", at: [1, 1], stem: "E", branches: ["S", "W"], initial: 0 },
    ],
    canonical: { J1: 1 },
  }),
  authored({
    number: 5,
    size: 5,
    name: ["Junction Master", "轉轍大師"],
    hint: [
      "Leave the circuit, then choose the open line. Check both decisions before you depart.",
      "先離開環線，再選擇暢通的路線。出發前，確認兩個轉轍器。",
    ],
    rationale:
      "Chapter-one synthesis: a cycle, a second independent decision and a visibly obstructed siding. Escaping the loop alone is insufficient.",
    paths: [
      [
        [1, 1],
        [3, 1],
        [3, 3],
        [1, 3],
        [1, 1],
      ],
      [
        [1, 1],
        [0, 1],
        [0, 0],
      ],
      [
        [0, 1],
        [0, 3],
      ],
    ],
    start: { at: [2, 1], exit: "W" },
    destination: [0, 0],
    junctions: [
      { id: "J1", at: [1, 1], stem: "E", branches: ["S", "W"], initial: 0 },
      { id: "J2", at: [0, 1], stem: "E", branches: ["N", "S"], initial: 1 },
    ],
    blocked: [[0, 3]],
    canonical: { J1: 1, J2: 0 },
  }),
  authored({
    number: 6,
    size: 6,
    name: ["Riverbend", "河畔彎道"],
    hint: [
      "The station is nearby, but the useful rail takes the long way around. Follow every bend.",
      "車站就在附近，通往車站的鐵軌卻繞了一大圈。沿著每個彎道看一看。",
    ],
    rationale:
      "A misleading straight siding contrasts with a long northern detour and a second switch near the destination. Two independent decisions, longer physical inspection.",
    paths: [
      [
        [0, 4],
        [1, 4],
        [1, 1],
        [4, 1],
        [4, 4],
        [5, 4],
      ],
      [
        [1, 4],
        [3, 4],
      ],
      [
        [4, 2],
        [5, 2],
      ],
    ],
    start: { at: [0, 4], exit: "E" },
    destination: [5, 4],
    junctions: [
      { id: "J1", at: [1, 4], stem: "W", branches: ["N", "E"], initial: 1 },
      { id: "J2", at: [4, 2], stem: "N", branches: ["E", "S"], initial: 0 },
    ],
    deadEnds: [[3, 4]],
    blocked: [[5, 2]],
    canonical: { J1: 0, J2: 1 },
  }),
  authored({
    number: 7,
    size: 6,
    name: ["Read the Points", "看懂轉轍器"],
    hint: [
      "A switch works in both directions. Arrive through its selected branch to leave through the stem.",
      "轉轍器可以雙向通行。從已選取的支線進入，才能由主幹駛出。",
    ],
    rationale:
      "Both junctions are approached from their selected branches, exercising reverse traversal and rejecting branch-to-branch shortcuts.",
    paths: [
      [
        [5, 4],
        [3, 4],
        [3, 1],
        [0, 1],
      ],
      [
        [3, 4],
        [1, 4],
      ],
      [
        [1, 1],
        [1, 3],
      ],
    ],
    start: { at: [5, 4], exit: "W" },
    destination: [0, 1],
    junctions: [
      { id: "J1", at: [3, 4], stem: "N", branches: ["E", "W"], initial: 1 },
      { id: "J2", at: [1, 1], stem: "W", branches: ["E", "S"], initial: 1 },
    ],
    deadEnds: [[1, 4]],
    blocked: [[1, 3]],
    canonical: { J1: 0, J2: 0 },
  }),
  authored({
    number: 8,
    size: 6,
    name: ["Post Before Parcels", "先郵件，後包裹"],
    hint: [
      "First the post office, then the parcel depot. A connected shortcut can still be the wrong journey.",
      "先到郵局，再到包裹站。即使鐵軌相連，捷徑也不一定是正確的旅程。",
    ],
    rationale:
      "The short path reaches the second required stop first. Correctly connected switches can therefore fail on objective order, not just connectivity.",
    paths: [
      [
        [0, 1],
        [4, 1],
        [4, 3],
        [0, 3],
      ],
      [
        [1, 1],
        [1, 2],
        [2, 2],
        [2, 3],
      ],
    ],
    start: { at: [0, 1], exit: "E" },
    destination: [0, 3],
    junctions: [
      { id: "J1", at: [1, 1], stem: "W", branches: ["E", "S"], initial: 1 },
      { id: "J2", at: [2, 3], stem: "W", branches: ["E", "N"], initial: 1 },
    ],
    stops: [
      { at: [3, 1], name: ["Post Office", "郵局"] },
      { at: [1, 3], name: ["Parcel Depot", "包裹站"] },
    ],
    canonical: { J1: 0, J2: 0 },
  }),
  authored({
    number: 9,
    size: 6,
    name: ["A Second Look", "再看一眼"],
    hint: [
      "Collect the orchard delivery, then leave the ring. Passing the old mill does not count as a required stop.",
      "取好果園貨物後，就離開環線。老磨坊只是沿途車站，不是指定停靠站。",
    ],
    rationale:
      "Objective-aware loop detection: the wrong configuration makes objective progress before revisiting rails; only a repeated complete directed state fails. An ordinary station is pass-through.",
    paths: [
      [
        [1, 1],
        [4, 1],
        [4, 4],
        [1, 4],
        [1, 1],
      ],
      [
        [1, 4],
        [0, 4],
      ],
      [
        [4, 3],
        [2, 3],
        [2, 2],
      ],
    ],
    start: { at: [2, 1], exit: "E" },
    destination: [0, 4],
    junctions: [
      { id: "J1", at: [4, 3], stem: "N", branches: ["W", "S"], initial: 1 },
      { id: "J2", at: [1, 4], stem: "E", branches: ["N", "W"], initial: 0 },
    ],
    stops: [{ at: [2, 4], name: ["Orchard Halt", "果園小站"] }],
    ordinaryStations: [{ at: [4, 2], name: ["Old Mill", "老磨坊"] }],
    blocked: [[2, 2]],
    canonical: { J1: 1, J2: 1 },
  }),
  authored({
    number: 10,
    size: 6,
    name: ["The Valley Round", "山谷巡禮"],
    hint: [
      "Three deliveries, four decisions. The northern shortcut arrives too soon; the long line visits every stop.",
      "三次配送，四次選擇。北方捷徑會太早到站；沿著長路線才能拜訪每一站。",
    ],
    rationale:
      "Chapter-two synthesis: four independent switches, a blocked branch, a tempting premature terminus and three ordered stops along a long outer route.",
    paths: [
      [
        [0, 5],
        [1, 5],
        [1, 1],
        [4, 1],
        [4, 3],
        [3, 3],
        [3, 5],
        [5, 5],
        [5, 0],
        [0, 0],
      ],
      [
        [1, 5],
        [2, 5],
      ],
      [
        [4, 1],
        [4, 0],
      ],
      [
        [3, 3],
        [3, 2],
      ],
    ],
    start: { at: [0, 5], exit: "E" },
    destination: [0, 0],
    junctions: [
      { id: "J1", at: [1, 5], stem: "W", branches: ["N", "E"], initial: 0 },
      { id: "J2", at: [4, 1], stem: "W", branches: ["N", "S"], initial: 0 },
      { id: "J3", at: [3, 3], stem: "E", branches: ["N", "S"], initial: 1 },
      { id: "J4", at: [4, 0], stem: "W", branches: ["E", "S"], initial: 1 },
    ],
    stops: [
      { at: [1, 2], name: ["Meadow Post", "草地郵站"] },
      { at: [3, 1], name: ["Hilltop Market", "山頂市集"] },
      { at: [5, 3], name: ["Riverside Halt", "河畔小站"] },
    ],
    deadEnds: [[2, 5]],
    blocked: [[3, 2]],
    canonical: { J1: 0, J2: 1, J3: 1, J4: 0 },
  }),
  authored({
    number: 11,
    size: 7,
    name: ["Better Together", "一起轉動"],
    hint: [
      "Junctions marked A move together. Change either one and both branches flip before departure.",
      "標有 A 的轉轍器會一起動。切換其中一個，兩個轉轍器的支線都會改變。",
    ],
    rationale:
      "Introduces one clearly marked two-member mechanical group. The same transaction opens the northern detour and the station approach.",
    paths: [
      [
        [0, 5],
        [1, 5],
        [1, 1],
        [5, 1],
        [5, 5],
        [6, 5],
      ],
      [
        [1, 5],
        [3, 5],
      ],
      [
        [5, 3],
        [3, 3],
      ],
    ],
    start: { at: [0, 5], exit: "E" },
    destination: [6, 5],
    junctions: [
      { id: "J1", at: [1, 5], stem: "W", branches: ["N", "E"], initial: 1 },
      { id: "J2", at: [5, 3], stem: "N", branches: ["S", "W"], initial: 1 },
    ],
    groups: [["J1", "J2"]],
    stops: [{ at: [3, 1], name: ["Signal School", "號誌學堂"] }],
    deadEnds: [[3, 5]],
    blocked: [[3, 3]],
    canonical: { J1: 0, J2: 0 },
  }),
  authored({
    number: 12,
    size: 7,
    name: ["Opposite Signals", "相反的號誌"],
    hint: [
      "Linked does not mean the same compass direction. Read both connections, especially the branch you arrive on.",
      "連動不代表朝向相同。看清楚兩處的連接方向，尤其是火車進入的支線。",
    ],
    rationale:
      "Opposite initial phases in a linked pair, selected-branch entry, and a visibly blocked central cross-connection. The group is atomic but its members face different ways.",
    paths: [
      [
        [6, 5],
        [1, 5],
        [1, 1],
        [6, 1],
      ],
      [
        [4, 5],
        [4, 1],
      ],
    ],
    start: { at: [6, 5], exit: "W" },
    destination: [6, 1],
    junctions: [
      { id: "J1", at: [4, 5], stem: "W", branches: ["E", "N"], initial: 1 },
      { id: "J2", at: [4, 1], stem: "W", branches: ["S", "E"], initial: 0 },
    ],
    groups: [["J1", "J2"]],
    stops: [{ at: [1, 3], name: ["Pine Nursery", "松林苗圃"] }],
    blocked: [[4, 3]],
    canonical: { J1: 0, J2: 1 },
  }),
  authored({
    number: 13,
    size: 7,
    name: ["Two in Tandem", "兩組默契"],
    hint: [
      "Two marked groups, two deliveries. Inspect every member before you commit to a change.",
      "兩組連動，兩次配送。每次切換前，都先看看同組的所有轉轍器。",
    ],
    rationale:
      "Two independent linked groups with different phases. Four visible junctions affect two decisions, ordered deliveries and a blocked internal connection.",
    paths: [
      [
        [0, 6],
        [1, 6],
        [1, 1],
        [5, 1],
        [5, 5],
        [2, 5],
      ],
      [
        [1, 6],
        [3, 6],
      ],
      [
        [3, 1],
        [3, 3],
        [5, 3],
      ],
      [
        [3, 5],
        [3, 4],
      ],
    ],
    start: { at: [0, 6], exit: "E" },
    destination: [2, 5],
    junctions: [
      { id: "J1", at: [1, 6], stem: "W", branches: ["N", "E"], initial: 1 },
      { id: "J2", at: [3, 1], stem: "W", branches: ["E", "S"], initial: 1 },
      { id: "J3", at: [5, 3], stem: "N", branches: ["S", "W"], initial: 1 },
      { id: "J4", at: [3, 5], stem: "E", branches: ["N", "W"], initial: 0 },
    ],
    groups: [
      ["J1", "J3"],
      ["J2", "J4"],
    ],
    stops: [
      { at: [1, 3], name: ["Forest Post", "森林郵站"] },
      { at: [4, 1], name: ["Clockmaker", "鐘錶工坊"] },
    ],
    deadEnds: [[3, 6]],
    blocked: [
      [3, 3],
      [3, 4],
    ],
    canonical: { J1: 0, J2: 0, J3: 0, J4: 1 },
  }),
  authored({
    number: 14,
    size: 7,
    name: ["Shared Horizons", "共同的遠方"],
    hint: [
      "Group A has three members. One final independent switch decides whether the deliveries reach home.",
      "A 組有三個轉轍器。最後一個獨立轉轍器，決定貨物能否平安到站。",
    ],
    rationale:
      "Three-member atomic linkage plus an independent exit, reverse stem traversal and three ordered objectives. Compass directions differ within the shared group.",
    paths: [
      [
        [0, 6],
        [1, 6],
        [1, 2],
        [3, 2],
        [3, 4],
        [5, 4],
        [5, 0],
        [0, 0],
      ],
      [
        [1, 6],
        [3, 6],
      ],
      [
        [3, 2],
        [4, 2],
      ],
      [
        [5, 4],
        [5, 6],
      ],
      [
        [3, 0],
        [3, 1],
      ],
    ],
    start: { at: [0, 6], exit: "E" },
    destination: [0, 0],
    junctions: [
      { id: "J1", at: [1, 6], stem: "W", branches: ["N", "E"], initial: 1 },
      { id: "J2", at: [3, 2], stem: "S", branches: ["W", "E"], initial: 1 },
      { id: "J3", at: [5, 4], stem: "W", branches: ["N", "S"], initial: 1 },
      { id: "J4", at: [3, 0], stem: "E", branches: ["W", "S"], initial: 1 },
    ],
    groups: [["J1", "J2", "J3"]],
    stops: [
      { at: [1, 4], name: ["Mountain Mail", "山間郵站"] },
      { at: [4, 4], name: ["Workshop", "機械工坊"] },
      { at: [5, 1], name: ["Lookout Halt", "瞭望小站"] },
    ],
    deadEnds: [
      [3, 6],
      [4, 2],
      [3, 1],
    ],
    blocked: [[5, 6]],
    canonical: { J1: 0, J2: 0, J3: 0, J4: 0 },
  }),
  authored({
    number: 15,
    size: 7,
    name: ["The Grand Junction", "鐵道大團圓"],
    hint: [
      "Three deliveries, two linked groups and the final exit. A complete circuit is only useful if you leave it at the right place.",
      "三次配送、兩組連動，還有最後的出口。環線只有在正確的地方離開，才能完成旅程。",
    ],
    rationale:
      "Final synthesis: five junctions, two linked phases and an independent ring exit; three ordered stops; a visibly blocked central branch; wrong full-state cycles after objective progress.",
    paths: [
      [
        [1, 1],
        [5, 1],
        [5, 5],
        [1, 5],
        [1, 1],
      ],
      [
        [3, 1],
        [3, 5],
      ],
      [
        [5, 3],
        [3, 3],
      ],
      [
        [1, 3],
        [0, 3],
      ],
    ],
    start: { at: [2, 1], exit: "E" },
    destination: [0, 3],
    junctions: [
      { id: "J1", at: [3, 1], stem: "W", branches: ["E", "S"], initial: 1 },
      { id: "J2", at: [5, 3], stem: "N", branches: ["S", "W"], initial: 1 },
      { id: "J3", at: [3, 5], stem: "E", branches: ["W", "N"], initial: 1 },
      { id: "J4", at: [1, 3], stem: "S", branches: ["N", "W"], initial: 0 },
      { id: "J5", at: [3, 3], stem: "S", branches: ["N", "E"], initial: 0 },
    ],
    groups: [
      ["J1", "J3"],
      ["J2", "J5"],
    ],
    stops: [
      { at: [4, 1], name: ["Sunrise Post", "晨光郵站"] },
      { at: [5, 4], name: ["Valley Market", "山谷市集"] },
      { at: [2, 5], name: ["Homeward Halt", "歸途小站"] },
    ],
    blocked: [[3, 2]],
    canonical: { J1: 0, J2: 0, J3: 0, J4: 1, J5: 1 },
  }),
];
