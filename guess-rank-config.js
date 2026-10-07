// Canonical Valorant rank order and Guess the Rank scoring (single source of truth).

export var CANONICAL_RANK_ORDER = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant'
];

var RANK_INDEX = {};
CANONICAL_RANK_ORDER.forEach(function (rank, index) {
  RANK_INDEX[rank] = index;
});

export var GUESS_RANK_POINTS = {
  0: 100,
  1: 85,
  2: 70,
  3: 55,
  4: 40,
  5: 25,
  6: 15,
  default: 0
};

export function isCanonicalRank(rank) {
  return typeof rank === 'string' && RANK_INDEX[rank] != null;
}

export function toCanonicalRank(mainRank, subrank) {
  if (!mainRank) return null;
  if (mainRank === 'Radiant') return 'Radiant';
  var sub = Number(subrank);
  if (!sub || sub < 1 || sub > 3) return null;
  return mainRank + ' ' + sub;
}

export function rankDistance(correctRank, guessedRank) {
  var correctIndex = RANK_INDEX[correctRank];
  var guessedIndex = RANK_INDEX[guessedRank];
  if (correctIndex == null || guessedIndex == null) return null;
  return Math.abs(correctIndex - guessedIndex);
}

export function pointsForDistance(distance) {
  if (distance == null || distance < 0) return 0;
  if (distance >= 7) return GUESS_RANK_POINTS.default;
  var points = GUESS_RANK_POINTS[distance];
  return points == null ? GUESS_RANK_POINTS.default : points;
}

export function feedbackLabelForDistance(distance) {
  if (distance === 0) return 'Perfect!';
  if (distance === 1) return 'Very Close!';
  if (distance === 2) return 'Close!';
  if (distance === 3) return 'Not Bad!';
  if (distance >= 4 && distance <= 6) return 'Keep Going!';
  return 'Way Off!';
}

export function fisherYatesShuffle(list) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
