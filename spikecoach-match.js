(function () {
  var REQUIRED_FEATURES = ['match_info', 'game_info', 'me', 'kill', 'death'];
  var EMPTY = '--';
  var SUBTEXT_SEP = ' \u00B7 ';

  var WEAPONS = {
    TX_Hud_Pistol_Classic: 'Classic',
    TX_Hud_Pistol_Slim: 'Shorty',
    TX_Hud_Pistol_AutoPistol: 'Frenzy',
    TX_Hud_Pistol_Luger: 'Ghost',
    TX_Hud_Pistol_Sheriff: 'Sheriff',
    TX_Hud_Shotguns_Pump: 'Bucky',
    TX_Hud_Shotguns_Persuader: 'Judge',
    TX_Hud_SMGs_Vector: 'Stinger',
    TX_Hud_SMGs_Ninja: 'Spectre',
    TX_Hud_Rifles_Burst: 'Bulldog',
    TX_Hud_Rifles_DMR: 'Guardian',
    TX_Hud_Rifles_Ghost: 'Phantom',
    TX_Hud_Rifles_Volcano: 'Vandal',
    TX_Hud_Sniper_Bolt: 'Marshal',
    TX_Hud_Sniper_Operater: 'Operator',
    TX_Hud_Sniper_DoubleSniper: 'Outlaw',
    TX_Hud_LMG: 'Ares',
    TX_Hud_HMG: 'Odin',
    knife: 'Knife',
    TX_Hud_Pistol_Glock_S: 'Classic',
    TX_Hud_Pistol_SawedOff_S: 'Shorty',
    TX_Hud_AutoPistol: 'Frenzy',
    TX_Hud_Pistol_Luger_S: 'Ghost',
    TX_Hud_Pistol_Revolver_S: 'Sheriff',
    TX_Hud_Pump: 'Bucky',
    TX_Hud_Shotguns_Spas12_S: 'Judge',
    TX_Hud_Vector: 'Stinger',
    TX_Hud_SMG_MP5_S: 'Spectre',
    TX_Hud_Burst: 'Bulldog',
    tx_hud_dmr: 'Guardian',
    TX_Hud_Assault_AR10A2_S: 'Phantom',
    TX_Hud_Volcano: 'Vandal',
    TX_Hud_Sniper_BoltAction_S: 'Marshal',
    TX_Hud_Operator: 'Operator',
    TX_Hud_DoubleSniper: 'Outlaw',
    TX_Hud_Knife_Standard_S: 'Knife'
  };

  var SHIELDS = { 0: 'None', 1: 'Light (25)', 2: 'Heavy (50)', 4: 'Regen (25)' };

  var MAP_NAMES = {
    Infinity: 'Abyss',
    Triad: 'Haven',
    Duality: 'Bind',
    Bonsai: 'Split',
    Ascent: 'Ascent',
    Port: 'Icebox',
    Foxtrot: 'Breeze',
    Canyon: 'Fracture',
    Pitt: 'Pearl',
    Jam: 'Lotus',
    Juliett: 'Sunset',
    Rook: 'Corrode',
    Range: 'Practice Range',
    HURM_Alley: 'District',
    HURM_Yard: 'Piazza',
    HURM_Bowl: 'Kasbah',
    HURM_Helix: 'Drift',
    HURM_HighTide: 'Glitch'
  };

  var MAP_LOADING = {
    Infinity: 'Loading_Screen_Abyss.webp',
    Abyss: 'Loading_Screen_Abyss.webp',
    Triad: 'Loading_Screen_Haven.webp',
    Haven: 'Loading_Screen_Haven.webp',
    Duality: 'Loading_Screen_Bind.webp',
    Bind: 'Loading_Screen_Bind.webp',
    Bonsai: 'Loading_Screen_Split.webp',
    Split: 'Loading_Screen_Split.webp',
    Ascent: 'Loading_Screen_Ascent.webp',
    Port: 'Loading_Screen_Icebox.webp',
    Icebox: 'Loading_Screen_Icebox.webp',
    Foxtrot: 'Loading_Screen_Breeze.webp',
    Breeze: 'Loading_Screen_Breeze.webp',
    Canyon: 'Loading_Screen_Fracture.webp',
    Fracture: 'Loading_Screen_Fracture.webp',
    Pitt: 'Loading_Screen_Pearl.webp',
    Pearl: 'Loading_Screen_Pearl.webp',
    Jam: 'Loading_Screen_Lotus.webp',
    Lotus: 'Loading_Screen_Lotus.webp',
    Juliett: 'Loading_Screen_Sunset.webp',
    Sunset: 'Loading_Screen_Sunset.webp',
    Rook: 'Loading_Screen_Corrode.webp',
    Corrode: 'Loading_Screen_Corrode.webp',
    Summit: 'Summit.jpg'
  };

  var PISTOLS = { Classic: true, Shorty: true, Frenzy: true, Ghost: true, Sheriff: true };

  // Add future rules to this list. enabled: false keeps the shape without firing.
  // The engine runs once after the match, keeps the highest priority rule in each group, and shows up to 5.
  var RECOMMENDATION_RULES = [
    {
      id: 'support-while-dying',
      category: 'Survivability',
      group: 'duel-outcome',
      priority: 94,
      enabled: true,
      minimumData: function (stats) {
        return stats.kills != null && stats.deaths != null && stats.assists != null &&
          stats.deaths >= 10 && stats.assists >= 6 && (stats.kills + stats.deaths) >= 12;
      },
      conditions: function (stats) { return stats.deaths > stats.kills; },
      title: 'Keep Your Support Impact While Staying Alive',
      message: function () {
        return 'You were involved in many successful teammate engagements, but your death count was also high. In this match, that support impact came with a lot of rounds where you were removed early. For future matches, look for safer positions after you have already helped a fight, so that contribution lasts longer.';
      },
      evidence: function (stats) {
        return 'K/D: ' + stats.kills + '/' + stats.deaths + ', Assists: ' + stats.assists;
      }
    },
    {
      id: 'fewer-isolated-fights',
      category: 'Survivability',
      group: 'duel-outcome',
      priority: 86,
      enabled: true,
      minimumData: function (stats) {
        return stats.kills != null && stats.deaths != null && stats.deaths >= 8 && (stats.kills + stats.deaths) >= 10;
      },
      conditions: function (stats) { return stats.deaths > stats.kills; },
      title: 'Take Fewer Isolated Fights',
      message: function () {
        return 'You finished this match with substantially more deaths than eliminations, which suggests too many of your engagements ended without enough support nearby. In future games, try taking more fights where a teammate can trade you or where you have a clear escape route. Reducing avoidable deaths should improve both your personal impact and your team\'s ability to keep numbers advantages.';
      },
      evidence: function (stats) {
        return 'K/D: ' + stats.kills + '/' + stats.deaths;
      }
    },
    {
      id: 'dueling-strength',
      category: 'Dueling',
      group: 'duel-outcome',
      priority: 40,
      enabled: true,
      minimumData: function (stats) {
        return stats.kills != null && stats.deaths != null && stats.kills >= 10;
      },
      conditions: function (stats) { return stats.kills >= stats.deaths + 4; },
      title: 'Dueling Was a Major Strength',
      message: function () {
        return 'You won a high percentage of your direct engagements this match and maintained strong kill output relative to your deaths. That gave your team consistent pressure and helped create player advantages. Keep looking for favorable fights, but avoid turning strong mechanics into unnecessary over-aggression.';
      },
      evidence: function (stats) {
        return 'K/D: ' + stats.kills + '/' + stats.deaths;
      }
    },
    {
      id: 'crosshair-placement',
      category: 'Precision',
      group: 'aim-quality',
      priority: 88,
      enabled: true,
      minimumData: function (stats) {
        return stats.hits != null && stats.headshots != null && stats.hits >= 15 && stats.hitSamples >= 4;
      },
      conditions: function (stats) { return stats.headshots / stats.hits < 0.15; },
      title: 'Improve Crosshair Placement',
      message: function () {
        return 'Your precision metrics were lower than the rest of your combat impact this match. Across completed rounds, a small share of recorded hits were headshots, which suggests some fights needed extra bullets. For future matches, focus on keeping your crosshair closer to common head-level positions before enemies appear so your first shots are more efficient.';
      },
      evidence: function (stats) {
        return 'Headshot metric: ' + headshotMetricLabel(stats);
      }
    },
    {
      id: 'solid-headshot-share',
      category: 'Precision',
      group: 'aim-quality',
      priority: 36,
      enabled: true,
      minimumData: function (stats) {
        return stats.hits != null && stats.headshots != null && stats.hits >= 15 && stats.hitSamples >= 4;
      },
      conditions: function (stats) { return stats.headshots / stats.hits >= 0.28; },
      title: 'Precision Was a Strength',
      message: function () {
        return 'Your headshot-related performance was strong across the match, suggesting disciplined crosshair placement and efficient first-shot accuracy. That helped you convert engagements quickly without relying on extended sprays. Keep maintaining this level of precision while balancing it with good positioning.';
      },
      evidence: function (stats) {
        return 'Headshot metric: ' + headshotMetricLabel(stats);
      }
    },
    {
      id: 'damage-not-converted',
      category: 'Dueling',
      group: 'damage-conversion',
      priority: 80,
      enabled: true,
      minimumData: function (stats) {
        return stats.damage != null && stats.kills != null && stats.damageSamples >= 4 && stats.damage >= 1400;
      },
      conditions: function (stats) {
        var rounds = stats.roundsSampled || stats.damageSamples;
        var adr = stats.damage / stats.damageSamples;
        return adr >= 130 && stats.kills < rounds * 0.7 && stats.kills <= 12;
      },
      title: 'Convert More Damage Into Eliminations',
      message: function () {
        return 'You dealt meaningful damage throughout the match but converted fewer of those engagements into kills than expected. Across completed rounds, that usually means you were creating pressure without always finishing fights. For future games, focus on coordinating follow-up damage with teammates and staying in favorable fights long enough to convert them.';
      },
      evidence: function (stats) {
        return 'Damage: ' + Math.round(stats.damage) + ', Kills: ' + stats.kills;
      }
    },
    {
      id: 'damage-taken-higher',
      category: 'Survivability',
      group: 'damage-balance',
      priority: 78,
      enabled: true,
      minimumData: function (stats) {
        return stats.damage != null && stats.damageReceived != null &&
          stats.damageSamples >= 4 && stats.damageReceivedSamples >= 4 &&
          (stats.damage + stats.damageReceived) >= 400;
      },
      conditions: function (stats) { return stats.damageReceived > stats.damage * 1.25; },
      title: 'Damage Taken Outpaced Damage Dealt',
      message: function () {
        return 'Across completed rounds, recorded damage taken was clearly higher than damage dealt. In this match, many engagements cost you more health than you were able to return. For future matches, look for fights you can start with an advantage, or leave earlier when the trade is already going against you.';
      },
      evidence: function (stats) {
        return 'Damage: ' + Math.round(stats.damage) + ' dealt, ' + Math.round(stats.damageReceived) + ' received';
      }
    },
    {
      id: 'damage-dealt-higher',
      category: 'Survivability',
      group: 'damage-balance',
      priority: 34,
      enabled: true,
      minimumData: function (stats) {
        return stats.damage != null && stats.damageReceived != null &&
          stats.damageSamples >= 4 && stats.damageReceivedSamples >= 4 && stats.damage >= 500;
      },
      conditions: function (stats) { return stats.damage >= stats.damageReceived * 1.25; },
      title: 'Damage Dealt Outpaced Damage Taken',
      message: function () {
        return 'Across completed rounds, recorded damage dealt stayed ahead of damage taken. That trade pattern was a strength in this match and helped you keep more of your health through engagements. For future matches, keep taking fights where you can deal damage before you absorb it.';
      },
      evidence: function (stats) {
        return 'Damage: ' + Math.round(stats.damage) + ' dealt, ' + Math.round(stats.damageReceived) + ' received';
      }
    },
    {
      id: 'incoming-hits',
      category: 'Survivability',
      group: 'incoming-pressure',
      priority: 68,
      enabled: true,
      minimumData: function (stats) {
        return stats.hitsDealt != null && stats.hitsReceived != null && stats.hitsDealt >= 10 && stats.hitsReceivedSamples >= 4;
      },
      conditions: function (stats) { return stats.hitsReceived > stats.hitsDealt * 1.2; },
      title: 'You Were Hit More Often Than You Connected',
      message: function () {
        return 'Across completed rounds, opponents landed more recorded hits on you than you landed on them. In this match, that usually means you were seen or shot before your own bullets connected. For future matches, focus on taking the first shot from a position you chose, instead of swinging into someone who is already aimed at you.';
      },
      evidence: function (stats) {
        return 'Hits dealt: ' + stats.hitsDealt + ', Hits received: ' + stats.hitsReceived;
      }
    },
    {
      id: 'utility-no-damage',
      category: 'Utility',
      group: 'ability-output',
      priority: 64,
      enabled: true,
      minimumData: function (stats) {
        return stats.abilityDamage != null && stats.abilitySamples >= 6;
      },
      conditions: function (stats) { return stats.abilityDamage === 0; },
      title: 'Create More Value With Utility',
      message: function () {
        return 'Your measurable ability damage was zero across the completed rounds sampled in this match. Ability damage does not include smokes, flashes, or other utility that does not deal damage, so this only covers the damage portion. For future matches, look for situations where utility can make an engagement safer, deny space, or support a teammate\'s fight, whether or not that use shows up as damage.';
      },
      evidence: function (stats) {
        return 'Ability damage: 0 across ' + stats.abilitySamples + ' rounds';
      }
    },
    {
      id: 'effective-utility-damage',
      category: 'Utility',
      group: 'ability-output',
      priority: 46,
      enabled: true,
      minimumData: function (stats) {
        return stats.abilityDamage != null && stats.abilitySamples >= 4;
      },
      conditions: function (stats) { return stats.abilityDamage >= 200; },
      title: 'Effective Utility Usage',
      message: function () {
        return 'Your abilities created meaningful recorded damage throughout the match. That shows you were contributing even when you were not securing the final elimination. Continue using utility in ways that make fights easier for your team in future matches.';
      },
      evidence: function (stats) {
        return 'Ability damage: ' + Math.round(stats.abilityDamage) + ' across ' + stats.abilitySamples + ' rounds';
      }
    },
    {
      id: 'low-assists',
      category: 'Teamplay',
      group: 'assist-rate',
      priority: 60,
      enabled: true,
      minimumData: function (stats) {
        return stats.assists != null && stats.kills != null && stats.deaths != null && (stats.kills + stats.deaths) >= 10;
      },
      conditions: function (stats) { return stats.assists <= 2; },
      title: 'Increase Your Team Fight Involvement',
      message: function () {
        return 'Your assist total was relatively low compared with the length of the match. This can mean you were often disconnected from teammate engagements or that your utility was not contributing to their fights. Look for more opportunities to support pushes, trade nearby teammates, or use utility to create easier engagements for others.';
      },
      evidence: function (stats) {
        return 'Assists: ' + stats.assists;
      }
    },
    {
      id: 'strong-team-contribution',
      category: 'Teamplay',
      group: 'assist-rate',
      priority: 44,
      enabled: true,
      minimumData: function (stats) {
        return stats.assists != null && stats.kills != null && stats.assists >= 6;
      },
      conditions: function (stats) {
        if (stats.deaths != null && stats.deaths > stats.kills && stats.deaths >= 10) return false;
        return stats.kills === 0 || stats.assists / stats.kills >= 0.45;
      },
      title: 'Strong Team Contribution',
      message: function () {
        return 'You contributed to a large number of teammate engagements through assists, showing that your impact extended beyond your own kills. This is especially valuable on agents whose role is to create opportunities for others. Continue prioritizing coordinated fights instead of judging your performance only by kill count.';
      },
      evidence: function (stats) {
        return 'Assists: ' + stats.assists;
      }
    },
    {
      id: 'ended-low-on-credits',
      category: 'Economy',
      group: 'ending-credits',
      priority: 54,
      enabled: true,
      minimumData: function (stats) {
        return stats.credits != null && stats.deaths != null && stats.deaths >= 10;
      },
      conditions: function (stats) { return stats.credits < 1000; },
      title: 'Ended Low on Credits',
      message: function () {
        return 'The last recorded credit total was low after a match with many deaths. This is only the closing balance from the scoreboard, not a round-by-round buy history. For future matches, dying often makes it harder to afford a full loadout on the rounds that follow, so staying alive also protects your economy.';
      },
      evidence: function (stats) {
        return 'Credits at last update: ' + stats.credits + ', Deaths: ' + stats.deaths;
      }
    },
    {
      id: 'second-half-drop',
      category: 'Consistency',
      group: 'half-trend',
      priority: 72,
      enabled: true,
      minimumData: function (stats) { return halfSamplesReady(stats); },
      conditions: function (stats) {
        return kd(stats.firstHalf) >= kd(stats.secondHalf) + 0.5 && stats.secondHalf.deaths > stats.secondHalf.kills;
      },
      title: 'Maintain Your Impact Through the Full Match',
      message: function () {
        return 'Your performance was noticeably stronger in the first half than in the second. This may indicate that the side switch, enemy adjustments, or your own engagement patterns changed later in the game. Review what worked early and look for ways to preserve those habits after the match environment changes.';
      },
      evidence: function (stats) {
        return 'First half K/D: ' + stats.firstHalf.kills + '/' + stats.firstHalf.deaths +
          ', Second half K/D: ' + stats.secondHalf.kills + '/' + stats.secondHalf.deaths;
      }
    },
    {
      id: 'strong-mid-match-adjustment',
      category: 'Adaptation',
      group: 'half-trend',
      priority: 50,
      enabled: true,
      minimumData: function (stats) { return halfSamplesReady(stats); },
      conditions: function (stats) {
        return kd(stats.secondHalf) >= kd(stats.firstHalf) + 0.5;
      },
      title: 'Strong Mid-Match Adjustment',
      message: function () {
        return 'Your impact improved significantly later in the match, suggesting that you adapted well after the early rounds. You may have adjusted your positioning, pacing, or approach to fights more effectively as the game progressed. Try identifying what changed so you can apply those adjustments earlier in future matches.';
      },
      evidence: function (stats) {
        return 'First half K/D: ' + stats.firstHalf.kills + '/' + stats.firstHalf.deaths +
          ', Second half K/D: ' + stats.secondHalf.kills + '/' + stats.secondHalf.deaths;
      }
    },
    {
      id: 'pistol-heavy-eliminations',
      category: 'Weapon Usage',
      group: 'weapon-mix',
      priority: 52,
      enabled: true,
      minimumData: function (stats) { return stats.weaponElims >= 6; },
      conditions: function (stats) { return stats.pistolElims / stats.weaponElims >= 0.6; },
      title: 'Many Eliminations Came From Pistols',
      message: function () {
        return 'Most eliminations tied to your name in the kill feed used a pistol. In this match, that means a large share of your kill output came from pistol rounds or pistol duels rather than your primary weapon. For future matches, review whether those later gun rounds produced the same impact as the opening duels.';
      },
      evidence: function (stats) {
        return 'Pistol eliminations: ' + stats.pistolElims + ' of ' + stats.weaponElims;
      }
    },
    {
      id: 'one-weapon-cluster',
      category: 'Weapon Usage',
      group: 'weapon-mix',
      priority: 42,
      enabled: true,
      minimumData: function (stats) {
        return stats.weaponElims >= 6 && stats.topWeapon && stats.topWeaponCount != null;
      },
      conditions: function (stats) { return stats.topWeaponCount / stats.weaponElims >= 0.75; },
      title: 'Eliminations Clustered on One Weapon',
      message: function (stats) {
        return 'Most eliminations tied to your name in the kill feed used ' + stats.topWeapon + '. That weapon was the main source of your kill output in this match. For future matches, notice which fights that weapon won for you and where a different loadout might have fit the round better.';
      },
      evidence: function (stats) {
        return stats.topWeapon + ': ' + stats.topWeaponCount + ' of ' + stats.weaponElims + ' eliminations';
      }
    },
    {
      id: 'low-impact-rating',
      category: 'Consistency',
      group: 'impact-summary',
      priority: 58,
      enabled: true,
      minimumData: function (stats) { return stats.impactRating != null; },
      conditions: function (stats) { return stats.impactRating <= 4.5; },
      title: 'Build More Consistent Match Impact',
      message: function () {
        return 'Your Impact Rating suggests that your contribution was uneven across several parts of the match. Rather than focusing only on kills, look at survivability, assists, utility, and damage together. Improving one or two weak categories can raise your overall impact substantially in future games.';
      },
      evidence: function (stats) {
        return 'Impact Rating: ' + stats.impactRating.toFixed(1) + '/10';
      }
    },
    {
      id: 'high-impact-rating',
      category: 'Consistency',
      group: 'impact-summary',
      priority: 32,
      enabled: true,
      minimumData: function (stats) { return stats.impactRating != null; },
      conditions: function (stats) { return stats.impactRating >= 7.5; },
      title: 'High Overall Match Impact',
      message: function () {
        return 'Your SpikeCoach Impact Rating indicates that you contributed strongly across multiple areas rather than relying on a single stat. Your combat, teamplay, and survivability combined to create consistent value for your team. Focus on maintaining that balance instead of chasing one specific metric.';
      },
      evidence: function (stats) {
        return 'Impact Rating: ' + stats.impactRating.toFixed(1) + '/10';
      }
    },
    {
      id: 'review-buy-timing',
      category: 'Economy',
      group: 'buy-sequence',
      priority: 58,
      enabled: false,
      minimumData: function () { return false; },
      conditions: function () { return false; },
      title: 'Review Your Buy Timing',
      message: function () { return ''; },
      evidence: function () { return 'Disabled: scoreboard money is only the latest credit total, not a buy each round.'; }
    },
    {
      id: 'site-positioning',
      category: 'Consistency',
      group: 'map-position',
      priority: 30,
      enabled: false,
      minimumData: function () { return false; },
      conditions: function () { return false; },
      title: 'Review Your Positioning',
      message: function () { return ''; },
      evidence: function () { return 'Disabled: no documented player-position field is stored.'; }
    },
    {
      id: 'enemy-patterns',
      category: 'Dueling',
      group: 'enemy-patterns',
      priority: 20,
      enabled: false,
      minimumData: function () { return false; },
      conditions: function () { return false; },
      title: 'Enemy Tendencies',
      message: function () { return ''; },
      evidence: function () { return 'Disabled: recommendations stay on your own recorded stats.'; }
    }
  ];

  var state = createMatchState(null);
  var selectedPlayerId = null;
  var recentKillSignatures = [];

  function createMatchState(matchId) {
    return {
      matchId: matchId,
      map: null,
      roundNumber: null,
      roundPhase: null,
      team: null,
      gameMode: null,
      gameState: null,
      matchOutcome: null,
      matchScore: null,
      local: {
        name: null,
        id: null,
        agent: null,
        health: null,
        abilities: null
      },
      killTotals: { kills: null, assists: null, headshots: null },
      deathTotal: null,
      players: {},
      roundsByNumber: {},
      roundReport: null,
      matchHeadHits: 0,
      matchTotalHits: 0,
      processedHeadshotRounds: {},
      firstHalf: null,
      killInteractions: {},
      localWeaponElims: {},
      postgameGenerated: false,
      matchEnded: false,
      recommendations: [],
      impactFrozen: null,
      impactBoardCache: null,
      lastImpactRatingRound: 0,
      impactMatchFinalized: false
    };
  }

  // SpikeCoach-only metric. Tune weights here. A null category is dropped and the
  // remaining weights are renormalized, so a missing input is never scored as zero.
  var IMPACT_RATING_CONFIG = {
    minRounds: 4,
    minRoundsIfMatchOver: 2,
    fullConfidenceRounds: 12,
    weights: {
      local: {
        combat: 0.30,
        damage: 0.20,
        teamplay: 0.15,
        utility: 0.15,
        survivability: 0.10,
        consistency: 0.10
      },
      shared: {
        combat: 0.35,
        teamplay: 0.20,
        survivability: 0.20,
        efficiency: 0.15,
        economy: 0.10
      }
    },
    neutralKd: 1,
    neutralKillsPerRound: 0.7,
    neutralDeathsPerRound: 0.75,
    neutralAssistsPerRound: 0.2,
    neutralAdr: 130,
    neutralHsRate: 0.2,
    neutralAbilityDamagePerRound: 20,
    neutralSpread: 0.45,
    labels: {
      combat: 'Combat',
      damage: 'Damage',
      teamplay: 'Teamplay',
      utility: 'Utility',
      survivability: 'Survivability',
      consistency: 'Consistency',
      efficiency: 'Efficiency',
      economy: 'Economy'
    }
  };

  function impactClamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function impactAverage(parts) {
    var nums = parts.filter(function (n) { return n != null && !isNaN(n); });
    if (!nums.length) return null;
    return nums.reduce(function (sum, n) { return sum + n; }, 0) / nums.length;
  }

  // Neutral input => 5. Doubling a neutral rate lands near 7.5, not 10.
  // The curve flattens, so one huge stat cannot reach the top of the scale.
  function ratioScore(value, neutral) {
    if (value == null || neutral == null || !(neutral > 0)) return null;
    var shaped = Math.tanh(Math.log(Math.max(value, 0.02) / neutral));
    return impactClamp(5 + shaped * 4.2, 1.2, 9.4);
  }

  function combineWeighted(scores, weights) {
    var acc = 0;
    var sum = 0;
    var included = {};
    Object.keys(weights).forEach(function (key) {
      if (scores[key] == null || !(weights[key] > 0)) return;
      acc += scores[key] * weights[key];
      sum += weights[key];
      included[key] = scores[key];
    });
    return { score: sum > 0 ? acc / sum : null, included: included };
  }

  function matchHasEnded(ms) {
    return !!(ms.matchEnded || ms.roundPhase === 'game_end' ||
      (ms.roundNumber != null && (ms.gameState === 'LeavingMap' || ms.gameState === 'Aborted')) ||
      (ms.gameState && ms.gameState !== 'InProgress' && ms.roundNumber != null &&
        (ms.matchOutcome === 'victory' || ms.matchOutcome === 'defeat' || ms.matchOutcome === 'draw')));
  }

  function completedRounds(ms) {
    var sampled = Object.keys(ms.roundsByNumber || {}).length;
    var fromPhase = 0;
    if (ms.roundNumber != null) {
      var closed = ms.roundPhase === 'end' || ms.roundPhase === 'game_end' || ms.matchEnded;
      fromPhase = closed ? ms.roundNumber : Math.max(0, ms.roundNumber - 1);
    }
    return Math.max(sampled, fromPhase);
  }

  function impactPlayers(ms) {
    return Object.keys(ms.players || {}).map(function (id) { return ms.players[id]; });
  }

  function impactLocalPlayer(ms) {
    var found = impactPlayers(ms).filter(function (player) { return player.isLocal; })[0];
    return found || null;
  }

  function impactNumber(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    return isNaN(number) ? null : number;
  }

  function statOr(player, key, fallback) {
    if (player && player[key] != null && player[key] !== '') return impactNumber(player[key]);
    return impactNumber(fallback);
  }

  function lobbyAverages(ms) {
    var list = impactPlayers(ms);
    function avg(key) {
      var vals = list.map(function (player) { return impactNumber(player[key]); }).filter(function (n) { return n != null; });
      if (!vals.length) return null;
      return vals.reduce(function (sum, n) { return sum + n; }, 0) / vals.length;
    }
    return { avgKills: avg('kills'), avgDeaths: avg('deaths'), avgAssists: avg('assists') };
  }

  function sumRoundReports(ms) {
    var totals = { damage: 0, damageSamples: 0, damageReceived: 0, damageReceivedSamples: 0, hits: 0, hitSamples: 0, headshots: 0, ability: 0, abilitySamples: 0, perRoundDamage: [] };
    Object.keys(ms.roundsByNumber || {}).forEach(function (key) {
      var report = ms.roundsByNumber[key];
      if (!report) return;
      function add(field, sampleField, value) {
        var number = impactNumber(value);
        if (number == null) return;
        totals[field] += number;
        totals[sampleField] += 1;
      }
      add('damage', 'damageSamples', report.damage);
      add('damageReceived', 'damageReceivedSamples', report.damage_received);
      add('ability', 'abilitySamples', report.ability_damage);
      var bulletHits = bulletHitsFromReport(report);
      if (bulletHits && bulletHits.total > 0) {
        totals.hits += bulletHits.total;
        totals.hitSamples += 1;
        totals.headshots += bulletHits.head;
      }
      var dealt = impactNumber(report.damage);
      if (dealt != null) totals.perRoundDamage.push(dealt);
    });
    return totals;
  }

  function feedSpread(ms, name) {
    var bag = name && ms.killInteractions ? ms.killInteractions[name] : null;
    if (!bag) return { kills: 0, victims: 0 };
    var kills = 0;
    var victims = 0;
    Object.keys(bag).forEach(function (victim) {
      kills += bag[victim];
      victims += 1;
    });
    return { kills: kills, victims: victims };
  }

  function combatScore(kills, deaths, rounds, lobby) {
    var parts = [];
    if (kills != null && deaths != null) {
      if (kills === 0 && deaths === 0) parts.push(5);
      else parts.push(ratioScore(deaths === 0 ? kills : kills / deaths, IMPACT_RATING_CONFIG.neutralKd));
    }
    if (kills != null && lobby.avgKills != null && lobby.avgKills > 0) parts.push(ratioScore(kills, lobby.avgKills));
    else if (kills != null && rounds > 0) parts.push(ratioScore(kills / rounds, IMPACT_RATING_CONFIG.neutralKillsPerRound));
    return impactAverage(parts);
  }

  function teamplayScore(assists, rounds, lobby) {
    if (assists == null) return null;
    var baseline = lobby.avgAssists != null && lobby.avgAssists > 0
      ? lobby.avgAssists
      : (rounds > 0 ? IMPACT_RATING_CONFIG.neutralAssistsPerRound * rounds : null);
    if (baseline == null) return null;
    if (assists === 0 && (lobby.avgAssists == null || lobby.avgAssists === 0)) return 5;
    return ratioScore(assists, baseline);
  }

  function survivabilityScore(deaths, kills, rounds, lobby, damageRatio) {
    if (deaths == null || !(rounds > 0)) return null;
    var raw = ratioScore(IMPACT_RATING_CONFIG.neutralDeathsPerRound, Math.max(deaths / rounds, 0.05));
    var activity = 1;
    if (kills != null && lobby.avgKills != null && lobby.avgKills > 0) activity = impactClamp(kills / lobby.avgKills, 0.4, 1);
    var adjusted = raw >= 5 ? 5 + (raw - 5) * activity : raw;
    if (damageRatio == null) return adjusted;
    return impactAverage([adjusted, damageRatio]);
  }

  // Credits and current ultimate points are snapshots, so they are not scored.
  // Saving credits or having just cast an ultimate would otherwise distort the rating.
  function economyScore() {
    return null;
  }

  function applyConfidence(raw, rounds, included) {
    var cfg = IMPACT_RATING_CONFIG;
    var pull = 0.4 + 0.6 * impactClamp(rounds / cfg.fullConfidenceRounds, 0, 1);
    var score = 5 + (raw - 5) * pull;
    var keys = Object.keys(included);
    var allHigh = keys.length >= 4 && keys.every(function (key) { return included[key] >= 9.1; });
    if (allHigh && raw >= 9.3 && rounds >= 20) return 10;
    return Math.round(impactClamp(score, 1, 9.9) * 10) / 10;
  }

  function categoryList(order, included) {
    return order.map(function (key) {
      var score = included[key];
      return {
        key: key,
        label: IMPACT_RATING_CONFIG.labels[key],
        score: score == null ? null : Math.round(score * 10) / 10
      };
    });
  }

  function emptyImpact(pending, order) {
    return {
      ready: false,
      pending: pending,
      rating: null,
      label: null,
      categories: categoryList(order, {})
    };
  }

  function finishImpact(scores, weights, rounds, order) {
    var combined = combineWeighted(scores, weights);
    if (combined.score == null) return emptyImpact(true, order);
    var rating = applyConfidence(combined.score, rounds, combined.included);
    return {
      ready: true,
      pending: false,
      rating: rating,
      label: rating.toFixed(1),
      categories: categoryList(order, combined.included)
    };
  }

  function calculateLocalImpactRating(ms) {
    var order = ['combat', 'damage', 'teamplay', 'utility', 'survivability', 'consistency'];
    var rounds = completedRounds(ms);
    var minimum = matchHasEnded(ms) ? IMPACT_RATING_CONFIG.minRoundsIfMatchOver : IMPACT_RATING_CONFIG.minRounds;
    var local = impactLocalPlayer(ms);
    var kills = statOr(local, 'kills', ms.killTotals && ms.killTotals.kills);
    var deaths = statOr(local, 'deaths', ms.deathTotal);
    var assists = statOr(local, 'assists', ms.killTotals && ms.killTotals.assists);
    if (rounds < minimum || (kills == null && deaths == null && assists == null)) return emptyImpact(true, order);

    var lobby = lobbyAverages(ms);
    var reports = sumRoundReports(ms);
    var hsRate = reports.hitSamples >= 3 && reports.hits > 0 ? reports.headshots / reports.hits : null;
    var combatParts = [combatScore(kills, deaths, rounds, lobby)];
    if (hsRate != null) combatParts.push(ratioScore(hsRate, IMPACT_RATING_CONFIG.neutralHsRate));

    var damage = null;
    var damageRatio = null;
    if (reports.damageSamples >= 3) {
      damage = ratioScore(reports.damage / reports.damageSamples, IMPACT_RATING_CONFIG.neutralAdr);
      if (reports.damageReceivedSamples >= 3 && reports.damageReceived > 0) {
        damageRatio = ratioScore(reports.damage / reports.damageReceived, 1);
      }
    }

    var utility = null;
    if (reports.abilitySamples >= 3 && reports.ability > 0) {
      utility = ratioScore(reports.ability / reports.abilitySamples, IMPACT_RATING_CONFIG.neutralAbilityDamagePerRound);
    }

    var consistency = null;
    if (reports.perRoundDamage.length >= 4) {
      var mean = reports.perRoundDamage.reduce(function (sum, n) { return sum + n; }, 0) / reports.perRoundDamage.length;
      if (mean > 0) {
        var variance = reports.perRoundDamage.reduce(function (sum, n) { return sum + Math.pow(n - mean, 2); }, 0) / reports.perRoundDamage.length;
        var stability = ratioScore(0.55, Math.max(Math.sqrt(variance) / mean, 0.05));
        consistency = mean < 40 ? Math.min(stability, 5) : stability;
      }
    }

    return finishImpact({
      combat: impactAverage(combatParts),
      damage: impactAverage([damage, damageRatio]),
      teamplay: teamplayScore(assists, rounds, lobby),
      utility: utility,
      survivability: survivabilityScore(deaths, kills, rounds, lobby, damageRatio),
      consistency: consistency
    }, IMPACT_RATING_CONFIG.weights.local, rounds, order);
  }

  function calculateSharedPlayerImpactRating(player, ms) {
    var order = ['combat', 'teamplay', 'survivability', 'efficiency', 'economy'];
    var rounds = completedRounds(ms);
    var minimum = matchHasEnded(ms) ? IMPACT_RATING_CONFIG.minRoundsIfMatchOver : IMPACT_RATING_CONFIG.minRounds;
    var kills = impactNumber(player && player.kills);
    var deaths = impactNumber(player && player.deaths);
    var assists = impactNumber(player && player.assists);
    if (rounds < minimum) return emptyImpact(true, order);
    if (kills == null && deaths == null && assists == null) return emptyImpact(false, order);

    var lobby = lobbyAverages(ms);
    var spread = feedSpread(ms, player && player.name);
    var efficiency = null;
    if (spread.kills >= 3) efficiency = ratioScore(spread.victims / spread.kills, IMPACT_RATING_CONFIG.neutralSpread);

    return finishImpact({
      combat: combatScore(kills, deaths, rounds, lobby),
      teamplay: teamplayScore(assists, rounds, lobby),
      survivability: survivabilityScore(deaths, kills, rounds, lobby, null),
      efficiency: efficiency,
      economy: economyScore()
    }, IMPACT_RATING_CONFIG.weights.shared, rounds, order);
  }

  function buildImpactBoard(ms) {
    var board = { local: calculateLocalImpactRating(ms), byId: {} };
    impactPlayers(ms).forEach(function (player) {
      board.byId[player.id] = player.isLocal ? board.local : calculateSharedPlayerImpactRating(player, ms);
    });
    return board;
  }

  function buildPendingImpactBoard(ms) {
    var target = ms || state;
    var localOrder = ['combat', 'damage', 'teamplay', 'utility', 'survivability', 'consistency'];
    var sharedOrder = ['combat', 'teamplay', 'survivability', 'efficiency', 'economy'];
    var board = { local: emptyImpact(true, localOrder), byId: {} };
    impactPlayers(target).forEach(function (player) {
      board.byId[player.id] = player.isLocal ? board.local : emptyImpact(true, sharedOrder);
    });
    return board;
  }

  function displayImpactBoard() {
    if (state.impactFrozen) return state.impactFrozen;
    if (state.impactBoardCache) return state.impactBoardCache;
    return buildPendingImpactBoard(state);
  }

  function tryRecalculateImpactRating() {
    if (state.impactMatchFinalized) return;

    if (matchHasEnded(state)) {
      snapshotRound();
      var finalBoard = buildImpactBoard(state);
      state.impactBoardCache = finalBoard;
      state.impactFrozen = finalBoard;
      state.lastImpactRatingRound = Math.max(state.lastImpactRatingRound, completedRounds(state));
      state.impactMatchFinalized = true;
      console.log('[SpikeCoach Impact Rating] Calculating after match end');
      return;
    }

    if (state.roundPhase !== 'end' || state.roundNumber == null) return;
    if (state.roundNumber <= state.lastImpactRatingRound) return;

    snapshotRound();
    if (!state.roundsByNumber[state.roundNumber]) return;

    var completedRound = state.roundNumber;
    state.lastImpactRatingRound = completedRound;
    state.impactBoardCache = buildImpactBoard(state);
    console.log('[SpikeCoach Impact Rating] Calculating after completed round: ' + completedRound);
  }

  function resetMatch(matchId) {
    selectedPlayerId = null;
    recentKillSignatures = [];
    state = createMatchState(matchId || null);
    render();
  }

  function kd(sample) {
    if (!sample || sample.kills == null || sample.deaths == null) return null;
    if (sample.deaths === 0) return sample.kills;
    return sample.kills / sample.deaths;
  }

  function halfSamplesReady(stats) {
    if (!stats.firstHalf || !stats.secondHalf) return false;
    var firstFights = stats.firstHalf.kills + stats.firstHalf.deaths;
    var secondFights = stats.secondHalf.kills + stats.secondHalf.deaths;
    return stats.firstHalf.kills != null && stats.firstHalf.deaths != null &&
      stats.secondHalf.kills != null && stats.secondHalf.deaths != null &&
      firstFights >= 4 && secondFights >= 4;
  }

  function parseMaybeJson(value) {
    if (value == null || typeof value === 'object') return value;
    if (typeof value !== 'string') return value;
    var text = value.trim();
    if (!text) return null;
    try {
      var parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        try { return JSON.parse(parsed); } catch (error) { return parsed; }
      }
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function parseRoundReport(value) {
    var parsed = parseMaybeJson(value);
    if (parsed && typeof parsed === 'object') return parsed;
    if (typeof value !== 'string') return null;
    var text = value.trim().replace(/^"|"$/g, '');
    if (!text) return null;
    if (text.charAt(0) !== '{') text = '{' + text + '}';
    try { return JSON.parse(text); } catch (error) { return null; }
  }

  function asNumber(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    return isNaN(number) ? null : number;
  }

  function asBool(value) {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }

  function agentName(raw) {
    if (window.resolveValorantAgentName) return window.resolveValorantAgentName(raw);
    if (!raw) return null;
    return raw;
  }

  function agentIcon(name) {
    if (window.valorantAgentIconPath) return window.valorantAgentIconPath(name);
    if (!name) return '';
    return 'Agent_Icons/' + name + '_icon.webp';
  }

  function applyAgentIconFallback(img) {
    if (window.bindValorantAgentIconFallback) window.bindValorantAgentIconFallback(img);
  }

  function weaponName(raw) {
    if (!raw) return null;
    return WEAPONS[raw] || raw;
  }

  function shieldName(value) {
    var number = asNumber(value);
    if (number == null || number === 3) return null;
    return SHIELDS[number] || null;
  }

  function formatCredits(value) {
    var number = asNumber(value);
    if (number == null) return null;
    return number.toLocaleString('en-US') + ' cr';
  }

  function playerSubtext(player) {
    if (!player) return '';
    var parts = [];
    if (player.agent) parts.push(player.agent);
    if (showLoadout(player) && weaponName(player.weapon)) parts.push(weaponName(player.weapon));
    if (showEconomy(player) && player.credits != null) parts.push(formatCredits(player.credits));
    if (player.ultPoints != null && player.ultMax != null) {
      parts.push('Ult ' + player.ultPoints + '/' + player.ultMax);
    } else if (player.ultPoints != null) {
      parts.push('Ult ' + player.ultPoints);
    }
    return parts.join(SUBTEXT_SEP);
  }

  function mapLoadingSrc() {
    if (state.map == null || state.map === '') return '';
    var raw = String(state.map).trim();
    var file = MAP_LOADING[raw] || MAP_LOADING[MAP_NAMES[raw]] || '';
    return file ? 'Map_Loading/' + file : '';
  }

  function headerMapLine() {
    var map = state.map ? mapLabel() : '';
    var mode = gameModeLabel();
    if (map && mode) return map + ' · ' + mode;
    return map || mode || '';
  }

  function mapLabel() {
    if (state.map == null || state.map === '') return 'Map pending';
    var raw = String(state.map);
    return MAP_NAMES[raw] || raw;
  }

  function gameModeLabel() {
    var mode = state.gameMode;
    if (mode == null || mode === '') return null;
    if (typeof mode !== 'object') return String(mode);
    var raw = mode.mode;
    if (raw == null || raw === '') return null;
    var key = String(raw).toLowerCase().replace(/\s+/g, ' ').trim();
    var names = {
      bomb: 'Unrated / Competitive',
      'quick bomb': 'Spike Rush',
      deathmatch: 'Deathmatch',
      escalation: 'Escalation',
      swift: 'Swiftplay',
      range: 'Range',
      'team deathmatch': 'Team Deathmatch',
      team_deathmatch: 'Team Deathmatch'
    };
    if (key === 'bomb' && String(mode.ranked) === '1') return 'Competitive';
    if (key === 'bomb' && (mode.custom === true || mode.custom === 'true')) return 'Custom';
    return names[key] || String(raw);
  }

  function matchScoreLabel() {
    var score = scoreText();
    if (score.left === EMPTY && score.right === EMPTY) return null;
    return score.left + ' - ' + score.right;
  }

  function dash(value) {
    return value == null || value === '' ? EMPTY : String(value);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function modeName() {
    var mode = state.gameMode && (state.gameMode.mode || state.gameMode);
    return String(mode || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isDeathmatch() {
    var mode = modeName();
    return mode === 'deathmatch' || mode === 'team deathmatch' || mode === 'team_deathmatch';
  }

  function firstHalfLength() {
    var mode = modeName();
    if (mode === 'bomb') return 12;
    if (mode === 'swift') return 4;
    return null;
  }

  function showLoadout(player) {
    return !!(player.isLocal || player.teammate || isDeathmatch());
  }

  function showEconomy(player) {
    return !!(player.isLocal || player.teammate);
  }

  function indexedEntries(bag, prefix) {
    return Object.keys(bag || {}).filter(function (key) {
      return key.indexOf(prefix) === 0;
    }).sort(function (a, b) {
      return asNumber(a.slice(prefix.length)) - asNumber(b.slice(prefix.length));
    });
  }

  function playerList() {
    return Object.keys(state.players).map(function (id) { return state.players[id]; });
  }

  function localPlayer() {
    var fromBoard = playerList().filter(function (player) { return player.isLocal; })[0];
    if (fromBoard) return fromBoard;
    if (!state.local.id && !state.local.name && !state.local.agent) return null;
    return {
      id: state.local.id,
      name: state.local.name,
      agent: state.local.agent,
      health: state.local.health,
      abilities: state.local.abilities,
      isLocal: true,
      teammate: true,
      kills: state.killTotals.kills,
      deaths: state.deathTotal,
      assists: state.killTotals.assists,
      credits: null,
      weapon: null,
      shield: null,
      ultPoints: null,
      ultMax: null,
      alive: null,
      team: null
    };
  }

  function sideForPlayer(player) {
    var local = localPlayer();
    if (!state.team) return null;
    if (!player || player.isLocal || (local && player.team != null && local.team != null && String(player.team) === String(local.team)) || player.teammate) {
      return state.team === 'attack' ? 'Attack' : (state.team === 'defense' ? 'Defense' : null);
    }
    if (state.team === 'attack') return 'Defense';
    if (state.team === 'defense') return 'Attack';
    return null;
  }

  function upsertPlayer(raw) {
    if (!raw) return;
    var id = raw.player_id || raw.playerId || raw.name;
    if (!id) return;
    var current = state.players[id] || { id: id };
    if (raw.name) current.name = raw.name;
    if (raw.character || raw.agent) current.agent = agentName(raw.character || raw.agent);
    if (raw.player_id) current.id = raw.player_id;
    var teammate = asBool(raw.teammate);
    var isLocal = asBool(raw.local != null ? raw.local : raw.is_local);
    if (teammate != null) current.teammate = teammate;
    if (isLocal != null) current.isLocal = isLocal;
    if (raw.team != null) current.team = raw.team;
    ['kills', 'deaths', 'assists', 'money', 'shield', 'ult_points', 'ult_max'].forEach(function (key) {
      if (raw[key] != null && raw[key] !== '') current[key] = raw[key];
    });
    if (raw.weapon != null && raw.weapon !== '') current.weapon = raw.weapon;
    var alive = asBool(raw.alive);
    if (alive != null) current.alive = alive;
    current.credits = current.money != null ? asNumber(current.money) : null;
    current.ultPoints = current.ult_points != null ? asNumber(current.ult_points) : null;
    current.ultMax = current.ult_max != null ? asNumber(current.ult_max) : null;
    state.players[id] = current;
    if (current.isLocal) {
      state.local.id = current.id;
      state.local.name = current.name || state.local.name;
      state.local.agent = current.agent || state.local.agent;
    }
  }

  function applyCategory(category, data) {
    if (!data || typeof data !== 'object') return;
    Object.keys(data).forEach(function (key) {
      var value = data[key];
      if (category === 'me') applyMe(key, value);
      else if (category === 'game_info') applyGameInfo(key, value);
      else if (category === 'match_info') applyMatchInfo(key, value);
      else if (category === 'kill') applyKillInfo(key, value);
      else if (category === 'death' && key === 'deaths') state.deathTotal = asNumber(value);
    });
  }

  function applyMe(key, value) {
    if (key === 'player_name') state.local.name = value;
    else if (key === 'player_id') state.local.id = value;
    else if (key === 'agent') state.local.agent = agentName(value);
    else if (key === 'health') state.local.health = asNumber(value);
    else if (key === 'abilities') state.local.abilities = parseMaybeJson(value);
  }

  function applyGameInfo(key, value) {
    if (key === 'state') state.gameState = value;
  }

  function applyKillInfo(key, value) {
    if (key === 'kills' || key === 'assists' || key === 'headshots') {
      state.killTotals[key] = asNumber(value);
    }
  }

  function applyMatchInfo(key, value) {
    if (key === 'map') {
      if (value != null && value !== '') state.map = value;
    }
    else if (key === 'round_number') state.roundNumber = asNumber(value);
    else if (key === 'round_phase') state.roundPhase = value;
    else if (key === 'team') state.team = value;
    else if (key === 'match_id' || key === 'pseudo_match_id') noteMatchId(value);
    else if (key === 'match_outcome') state.matchOutcome = value;
    else if (key === 'match_score' || key === 'score') state.matchScore = parseMaybeJson(value) || state.matchScore;
    else if (key === 'game_mode') state.gameMode = parseMaybeJson(value) || state.gameMode;
    else if (key === 'round_report') state.roundReport = parseRoundReport(value);
    else if (key === 'kill_feed') noteKillFeed(parseMaybeJson(value));
    else if (key.indexOf('roster_') === 0 || key.indexOf('scoreboard_') === 0) {
      upsertPlayer(parseMaybeJson(value));
    }
  }

  function noteMatchId(id) {
    if (!id) return;
    if (state.matchId && state.matchId !== id) resetMatch(id);
    else state.matchId = id;
  }

  function noteKillFeed(feed) {
    if (!feed || !feed.attacker || !feed.victim) return;
    if (feed.ult && !feed.weapon) return;
    if (!feed.weapon) return;
    var signature = [feed.attacker, feed.victim, feed.weapon, feed.headshot, state.roundNumber].join('|');
    var now = Date.now();
    recentKillSignatures = recentKillSignatures.filter(function (item) { return now - item.time < 2500; });
    if (recentKillSignatures.some(function (item) { return item.sig === signature; })) return;
    recentKillSignatures.push({ sig: signature, time: now });
    var attacker = String(feed.attacker).trim();
    var victim = String(feed.victim).trim();
    if (!state.killInteractions[attacker]) state.killInteractions[attacker] = {};
    state.killInteractions[attacker][victim] = (state.killInteractions[attacker][victim] || 0) + 1;
    if (isLocalAttacker(attacker)) {
      var weapon = weaponName(feed.weapon);
      if (weapon) state.localWeaponElims[weapon] = (state.localWeaponElims[weapon] || 0) + 1;
    }
  }

  function isLocalAttacker(attacker) {
    var names = [];
    if (state.local.name) names.push(String(state.local.name).trim());
    var local = localPlayer();
    if (local && local.name) names.push(String(local.name).trim());
    return names.indexOf(attacker) !== -1;
  }

  function addReportNumber(totals, field, value) {
    var number = asNumber(value);
    if (number == null) return;
    if (totals[field] == null) totals[field] = 0;
    totals[field] += number;
    totals[field + 'Samples'] = (totals[field + 'Samples'] || 0) + 1;
  }

  function reportCount(value) {
    if (value == null || value === '') return 0;
    var number = Number(value);
    return isNaN(number) ? 0 : number;
  }

  // round_report is per round. headshot excludes killing head hits; final_headshot is those kills.
  // hit is the documented total bullet hits and is the denominator.
  function normalizeRoundReport(rawReport) {
    var report = rawReport;
    if (typeof rawReport === 'string') report = parseRoundReport(rawReport);
    if (!report || typeof report !== 'object') return null;
    var hasHit = report.hit != null && report.hit !== '';
    return {
      hit: reportCount(report.hit),
      headshot: reportCount(report.headshot),
      finalHeadshot: reportCount(report.final_headshot),
      bodyshots: reportCount(report.bodyshots),
      legshots: reportCount(report.legshots),
      hasHit: hasHit
    };
  }

  function bulletHitsFromReport(report) {
    var normalized = normalizeRoundReport(report);
    if (!normalized) return null;
    if (normalized.headshot === 0 && normalized.finalHeadshot === 0 && normalized.bodyshots === 0 && normalized.legshots === 0 && !normalized.hasHit) return null;
    return {
      head: normalized.headshot + normalized.finalHeadshot,
      body: normalized.bodyshots,
      leg: normalized.legshots,
      total: normalized.headshot + normalized.finalHeadshot + normalized.bodyshots + normalized.legshots
    };
  }

  function maybeLogHeadshotRound(roundNumber, report, roundHeadHits) {
    try {
      if (localStorage.getItem('spikecoach_perf_debug') !== '1') return;
    } catch (error) {
      return;
    }
    var locationTotal = report.headshot + report.finalHeadshot + report.bodyshots + report.legshots;
    var percentage = state.matchTotalHits
      ? (Math.round(state.matchHeadHits / state.matchTotalHits * 1000) / 10).toFixed(1)
      : '--';
    console.log('[SpikeCoach HS] Round ' + roundNumber);
    console.log('hit=' + report.hit);
    console.log('headshot(non-lethal)=' + report.headshot);
    console.log('final_headshot(lethal)=' + report.finalHeadshot);
    console.log('body=' + report.bodyshots);
    console.log('leg=' + report.legshots);
    console.log('roundHeadHits=' + roundHeadHits);
    console.log('[SpikeCoach HS] Match');
    console.log('headHits=' + state.matchHeadHits);
    console.log('totalHits=' + state.matchTotalHits);
    console.log('percentage=' + (percentage === '--' ? percentage : percentage + '%'));
    if (locationTotal !== report.hit) {
      console.log('[SpikeCoach HS] Hit breakdown differs from total hit: round=' + roundNumber + ' totalHit=' + report.hit + ' locationTotal=' + locationTotal);
    }
  }

  function recordHeadshotRound(roundNumber, rawReport) {
    if (roundNumber == null || state.processedHeadshotRounds[roundNumber]) return;
    var report = normalizeRoundReport(rawReport);
    if (!report || !report.hasHit) return;
    state.processedHeadshotRounds[roundNumber] = true;
    var roundHeadHits = report.headshot + report.finalHeadshot;
    state.matchHeadHits += roundHeadHits;
    state.matchTotalHits += report.hit;
    maybeLogHeadshotRound(roundNumber, report, roundHeadHits);
  }

  function snapshotRound() {
    if (state.roundPhase !== 'end' || state.roundNumber == null || !state.roundReport) return;
    state.roundsByNumber[state.roundNumber] = state.roundReport;
    recordHeadshotRound(state.roundNumber, state.roundReport);
    var half = firstHalfLength();
    if (half == null || state.roundNumber !== half || state.firstHalf) return;
    var statsNow = combatTotals(null);
    if (statsNow.kills == null || statsNow.deaths == null) return;
    state.firstHalf = { kills: statsNow.kills, deaths: statsNow.deaths, assists: statsNow.assists };
  }

  function summedRounds() {
    var totals = { roundsSampled: 0 };
    Object.keys(state.roundsByNumber).forEach(function (key) {
      var report = state.roundsByNumber[key];
      if (!report) return;
      totals.roundsSampled += 1;
      addReportNumber(totals, 'hitsDealt', report.hit);
      addReportNumber(totals, 'damage', report.damage);
      addReportNumber(totals, 'damageReceived', report.damage_received);
      addReportNumber(totals, 'hitsReceived', report.hits_received);
      addReportNumber(totals, 'abilityDamage', report.ability_damage);
      var bulletHits = bulletHitsFromReport(report);
      if (bulletHits && bulletHits.total > 0) {
        addReportNumber(totals, 'hits', bulletHits.total);
        addReportNumber(totals, 'headshots', bulletHits.head);
        totals.bodyHits = (totals.bodyHits || 0) + bulletHits.body;
        totals.legHits = (totals.legHits || 0) + bulletHits.leg;
      }
    });
    return totals;
  }

  function combatTotals() {
    var local = localPlayer();
    return {
      kills: local && local.kills != null ? asNumber(local.kills) : state.killTotals.kills,
      deaths: local && local.deaths != null ? asNumber(local.deaths) : state.deathTotal,
      assists: local && local.assists != null ? asNumber(local.assists) : state.killTotals.assists,
      credits: local && showEconomy(local) && local.credits != null ? local.credits : null
    };
  }

  function weaponSummary() {
    var counts = state.localWeaponElims || {};
    var summary = { weaponElims: 0, pistolElims: 0, topWeapon: null, topWeaponCount: 0 };
    Object.keys(counts).forEach(function (name) {
      var count = counts[name];
      summary.weaponElims += count;
      if (PISTOLS[name]) summary.pistolElims += count;
      if (count > summary.topWeaponCount) {
        summary.topWeapon = name;
        summary.topWeaponCount = count;
      }
    });
    return summary;
  }

  function buildPostMatchStats() {
    var totals = summedRounds();
    var combat = combatTotals();
    var weapons = weaponSummary();
    var secondHalf = null;
    if (state.firstHalf && combat.kills != null && combat.deaths != null &&
        combat.kills >= state.firstHalf.kills && combat.deaths >= state.firstHalf.deaths) {
      secondHalf = {
        kills: combat.kills - state.firstHalf.kills,
        deaths: combat.deaths - state.firstHalf.deaths,
        assists: combat.assists != null && state.firstHalf.assists != null ? combat.assists - state.firstHalf.assists : null
      };
    }
    return {
      kills: combat.kills,
      deaths: combat.deaths,
      assists: combat.assists,
      credits: combat.credits,
      hits: totals.hits != null ? totals.hits : null,
      hitSamples: totals.hitsSamples || 0,
      headshots: totals.headshots != null ? totals.headshots : null,
      hitsDealt: totals.hitsDealt != null ? totals.hitsDealt : null,
      hitsDealtSamples: totals.hitsDealtSamples || 0,
      damage: totals.damage != null ? totals.damage : null,
      damageSamples: totals.damageSamples || 0,
      damageReceived: totals.damageReceived != null ? totals.damageReceived : null,
      damageReceivedSamples: totals.damageReceivedSamples || 0,
      hitsReceived: totals.hitsReceived != null ? totals.hitsReceived : null,
      hitsReceivedSamples: totals.hitsReceivedSamples || 0,
      abilityDamage: totals.abilityDamage != null ? totals.abilityDamage : null,
      abilitySamples: totals.abilityDamageSamples || 0,
      roundsSampled: totals.roundsSampled,
      impactRating: localImpactRating(),
      firstHalf: state.firstHalf,
      secondHalf: secondHalf,
      weaponElims: weapons.weaponElims,
      pistolElims: weapons.pistolElims,
      topWeapon: weapons.topWeapon,
      topWeaponCount: weapons.topWeaponCount
    };
  }

  function localImpactRating() {
    var board = state.impactFrozen || state.impactBoardCache;
    if (!board || !board.local || !board.local.ready || board.local.rating == null) return null;
    return board.local.rating;
  }

  function headshotMetricLabel(stats) {
    if (!stats || stats.hits == null || stats.headshots == null || !stats.hits) return '--';
    var percent = (Math.round(stats.headshots / stats.hits * 1000) / 10).toFixed(1);
    return percent + '% (' + stats.headshots + ' head hits / ' + stats.hits + ' bullet hits)';
  }

  function evaluateRules(stats) {
    var triggered = RECOMMENDATION_RULES.filter(function (rule) {
      if (rule.enabled === false) return false;
      try {
        return rule.minimumData(stats) && rule.conditions(stats);
      } catch (error) {
        return false;
      }
    }).sort(function (a, b) { return b.priority - a.priority; });
    var usedGroups = {};
    var picked = [];
    triggered.forEach(function (rule) {
      if (picked.length >= 5 || usedGroups[rule.group]) return;
      usedGroups[rule.group] = true;
      picked.push({
        id: rule.id,
        category: rule.category,
        group: rule.group,
        priority: rule.priority,
        title: rule.title,
        message: rule.message(stats),
        evidence: rule.evidence(stats)
      });
    });
    return picked;
  }

  function matchIsOver() {
    return !!(state.matchEnded || state.roundPhase === 'game_end' ||
      (state.roundNumber != null && (state.gameState === 'LeavingMap' || state.gameState === 'Aborted')) ||
      (state.gameState && state.gameState !== 'InProgress' && state.roundNumber != null &&
        (state.matchOutcome === 'victory' || state.matchOutcome === 'defeat' || state.matchOutcome === 'draw')));
  }

  function maybeGenerateRecommendations() {
    snapshotRound();
    if (state.postgameGenerated || !matchIsOver()) return;
    if (state.roundNumber == null && !playerList().length && state.killTotals.kills == null && state.deathTotal == null) return;
    tryRecalculateImpactRating();
    state.recommendations = evaluateRules(buildPostMatchStats());
    state.postgameGenerated = true;
  }

  function applyInfoPayload(payload, fromSnapshot) {
    if (!fromSnapshot) overlaySyncEpoch += 1;
    var info = payload && (payload.info || payload.res || payload);
    if (!info || typeof info !== 'object') return;
    ['me', 'game_info', 'match_info', 'kill', 'death'].forEach(function (category) {
      if (info[category]) applyCategory(category, info[category]);
    });
    if (payload && payload.feature && payload.key) {
      var bag = {};
      bag[payload.key] = payload.data != null ? payload.data : payload.value;
      applyCategory(payload.feature, bag);
    }
    maybeGenerateRecommendations();
    tryRecalculateImpactRating();
    schedulePaint();
  }

  function requestOverlaySnapshot(reason) {
    if (!overwolf.games.events.getInfo) return;
    var token = ++overlaySyncToken;
    var epoch = overlaySyncEpoch;
    perf.getInfo += 1;
    overwolf.games.events.getInfo(function (result) {
      if (token !== overlaySyncToken || epoch !== overlaySyncEpoch) return;
      if (result && result.success) applyInfoPayload(result, true);
    });
  }

  function onGameEvent(gameEvent) {
    if (!gameEvent || !gameEvent.name) return;
    overlaySyncEpoch += 1;
    if (gameEvent.name === 'match_start') {
      resetMatch(null);
      requestOverlaySnapshot('match-start');
      return;
    }
    if (gameEvent.name === 'kill_feed') noteKillFeed(parseMaybeJson(gameEvent.data));
    if (gameEvent.name === 'kill' || gameEvent.name === 'assist' || gameEvent.name === 'headshot') {
      var combatTotal = asNumber(gameEvent.data);
      if (combatTotal != null) {
        if (gameEvent.name === 'kill') state.killTotals.kills = combatTotal;
        else if (gameEvent.name === 'assist') state.killTotals.assists = combatTotal;
        else state.killTotals.headshots = combatTotal;
      }
    }
    if (gameEvent.name === 'death') {
      var deathTotal = asNumber(gameEvent.data);
      if (deathTotal != null) state.deathTotal = deathTotal;
    }
    if (gameEvent.name === 'match_end') state.matchEnded = true;
    maybeGenerateRecommendations();
    tryRecalculateImpactRating();
    schedulePaint();
  }

  var overlayVisible = true;
  var overlayDirty = false;
  var paintQueued = false;
  var statsStructureKey = '';
  var statsContentKey = '';
  var boardStructureKey = '';
  var boardContentKey = '';
  var recSignature = '';
  var overlaySyncToken = 0;
  var overlaySyncEpoch = 0;
  var perf = {
    gep: 0,
    statsFull: 0,
    statsPatch: 0,
    boardFull: 0,
    boardPatch: 0,
    recRender: 0,
    paintsSkippedHidden: 0,
    getInfo: 0
  };

  function maybeLogPerf() {
    try {
      if (localStorage.getItem('spikecoach_perf_debug') !== '1') return;
    } catch (error) {
      return;
    }
    if (!perf.gep || perf.gep % 50 !== 0) return;
    console.log('[SpikeCoach Perf] overlay', {
      gep: perf.gep,
      statsFull: perf.statsFull,
      statsPatch: perf.statsPatch,
      boardFull: perf.boardFull,
      boardPatch: perf.boardPatch,
      recRender: perf.recRender,
      paintsSkippedHidden: perf.paintsSkippedHidden,
      getInfo: perf.getInfo
    });
  }

  function setText(root, field, value) {
    var node = root.querySelector('[data-field="' + field + '"]');
    if (!node) return;
    var next = dash(value);
    if (node.textContent !== next) node.textContent = next;
  }

  function statsShellKey() {
    var local = localPlayer();
    var agent = (local && local.agent) || state.local.agent || '';
    return String(agent) + '|' + mapLoadingSrc();
  }

  function rosterKey() {
    var players = playerList();
    var allies = players.filter(function (player) { return player.teammate !== false; }).map(function (player) { return player.id; }).join(',');
    var enemies = players.filter(function (player) { return player.teammate === false; }).map(function (player) { return player.id; }).join(',');
    return allies + '||' + enemies + '||' + (state.map || '') + '||' + (gameModeLabel() || '') + '||' + (selectedPlayerId || '');
  }

  function recommendationSignature() {
    if (!state.postgameGenerated) return 'locked';
    if (!state.recommendations.length) return 'empty';
    return state.recommendations.map(function (rule) { return rule.id; }).join('|');
  }

  function impactSignature(result) {
    if (!result || !result.ready) return 'pending';
    return (result.label || '') + ':' + (result.categories || []).map(function (category) {
      return category.score == null ? '' : category.score;
    }).join(',');
  }

  function patchAbilities(view, agent) {
    var manifest = window.AGENT_ABILITY_MANIFEST && agent && window.AGENT_ABILITY_MANIFEST[agent];
    if (!manifest) return;
    var abilities = state.local.abilities;
    manifest.forEach(function (ability) {
      if (ability.label !== 'C' && ability.label !== 'Q' && ability.label !== 'E' && ability.label !== 'X') return;
      var ready = abilities && abilities[ability.label] === true;
      var unavailable = abilities && abilities[ability.label] === false;
      var status = ready ? 'Ready' : (unavailable ? 'Unavailable' : '--');
      setText(view, 'ability-' + ability.label, status);
      var card = view.querySelector('[data-ability="' + ability.label + '"]');
      if (!card) return;
      card.className = 'ability' + (ready ? ' ready' : (unavailable ? ' unavailable' : ''));
    });
  }

  function patchRoundReport(view) {
    var report = state.roundReport;
    function num(key) { return asNumber(roundReportValue(report, key)); }
    function show(key) {
      var value = num(key);
      return value == null ? null : (Math.round(value * 10) / 10);
    }
    setText(view, 'damage', show('damage'));
    setText(view, 'damage-received', show('damage_received'));
    setText(view, 'hits', show('hit'));
    setText(view, 'final-headshot', show('final_headshot'));
    setText(view, 'hits-received', show('hits_received'));
    setText(view, 'ability-damage', show('ability_damage'));
    var head = (num('headshot') || 0) + (num('final_headshot') || 0);
    var hasHead = num('headshot') != null || num('final_headshot') != null;
    var body = num('bodyshots');
    var leg = num('legshots');
    var spread = (hasHead ? head : 0) + (body || 0) + (leg || 0);
    var barHost = view.querySelector('.round-report .hit-bar');
    if (barHost && spread > 0 && !barHost.querySelector('[data-field="hit-head"]')) {
      barHost.outerHTML = '<div class="hit-bar">' +
        '<span class="hit-seg head" data-field="hit-head"></span>' +
        '<span class="hit-seg body" data-field="hit-body"></span>' +
        '<span class="hit-seg leg" data-field="hit-leg"></span></div>';
    }
    function width(field, value) {
      var node = view.querySelector('[data-field="' + field + '"]');
      if (!node) return;
      node.style.width = (spread > 0 ? (value / spread * 100) : 0) + '%';
    }
    width('hit-head', hasHead ? head : 0);
    width('hit-body', body || 0);
    width('hit-leg', leg || 0);
    setText(view, 'legend-head', hasHead ? head : null);
    setText(view, 'legend-body', body);
    setText(view, 'legend-leg', leg);
    var tag = view.querySelector('.round-report [data-field="round-tag"]');
    if (tag) tag.textContent = state.roundNumber != null ? ('Round ' + state.roundNumber) : '';
  }

  function patchStats(view) {
    var local = localPlayer();
    var agent = (local && local.agent) || state.local.agent;
    var name = (local && local.name) || state.local.name;
    var kills = local && local.kills != null ? local.kills : state.killTotals.kills;
    var deaths = local && local.deaths != null ? local.deaths : state.deathTotal;
    var assists = local && local.assists != null ? local.assists : state.killTotals.assists;
    var weapon = local && showLoadout(local) ? weaponName(local.weapon) : null;
    var shield = local && showEconomy(local) ? shieldName(local.shield) : null;
    var ult = null;
    if (local && local.ultPoints != null) {
      ult = local.ultMax != null ? (local.ultPoints + ' / ' + local.ultMax) : String(local.ultPoints);
    }
    var credits = local && showEconomy(local) && local.credits != null ? formatCredits(local.credits) : null;
    var health = state.local.health;
    var healthPct = health == null ? 0 : Math.max(0, Math.min(100, health));
    var healthClass = health == null ? '' : (health <= 30 ? ' low' : (health <= 60 ? ' mid' : ''));
    var ultPct = local && local.ultPoints != null && local.ultMax ? Math.max(0, Math.min(100, local.ultPoints / local.ultMax * 100)) : 0;
    setText(view, 'agent', agent);
    setText(view, 'player-name', name);
    setText(view, 'health', health);
    setText(view, 'kills', kills);
    setText(view, 'deaths', deaths);
    setText(view, 'assists', assists);
    setText(view, 'hs-percent', headshotPercentLabel());
    setText(view, 'headshots', state.killTotals.headshots);
    setText(view, 'weapon', weapon);
    setText(view, 'shield', shield);
    setText(view, 'credits', credits);
    setText(view, 'ult', ult);
    setText(view, 'mode', gameModeLabel());
    setText(view, 'map', state.map ? mapLabel() : null);
    var heroMap = view.querySelector('[data-field="hero-map"]');
    if (heroMap) {
      var heroMapLabel = state.map ? mapLabel() : '';
      if (heroMap.textContent !== heroMapLabel) heroMap.textContent = heroMapLabel;
    }
    setText(view, 'side', sideForPlayer(local || { isLocal: true }));
    setText(view, 'round', state.roundNumber);
    setText(view, 'score', matchScoreLabel());
    var healthNode = view.querySelector('[data-field="health"]');
    if (healthNode) healthNode.className = 'hero-health-value' + healthClass;
    var healthBar = view.querySelector('[data-field="health-bar"]');
    if (healthBar) {
      healthBar.style.width = healthPct + '%';
      healthBar.className = 'bar-fill health' + healthClass;
    }
    var ultBar = view.querySelector('[data-field="ult-bar"]');
    if (ultBar) ultBar.style.width = ultPct + '%';
    patchRoundReport(view);
    patchAbilities(view, agent);
    var impact = displayImpactBoard();
    var card = view.querySelector('.impact-card');
    var impactSig = impactSignature(impact && impact.local);
    if (card && card.getAttribute('data-impact-sig') !== impactSig) {
      card.outerHTML = impactCardHtml(impact.local).replace(
        '<section class="impact-card"',
        '<section class="impact-card" data-impact-sig="' + escapeHtml(impactSig) + '"'
      );
    }
  }

  function collectStatsContentKey() {
    var local = localPlayer();
    var impact = displayImpactBoard();
    return [
      state.local.health,
      local && local.kills,
      local && local.deaths,
      local && local.assists,
      local && local.weapon,
      local && local.credits,
      local && local.shield,
      local && local.ultPoints,
      state.matchHeadHits + '/' + state.matchTotalHits,
      state.roundNumber,
      state.map,
      state.team,
      JSON.stringify(state.local.abilities || null),
      JSON.stringify(state.roundReport || null),
      impactSignature(impact && impact.local),
      matchScoreLabel()
    ].join('|');
  }

  function scoreboardContentKey() {
    var score = scoreText();
    var impact = displayImpactBoard();
    var players = playerList().map(function (player) {
      var entry = impact && impact.byId ? impact.byId[player.id] : null;
      return [
        player.id, player.kills, player.deaths, player.assists, player.alive,
        player.weapon, player.credits, player.agent, player.name,
        entry && entry.ready ? entry.label : ''
      ].join(':');
    }).join(';');
    return [score.left, score.right, state.roundNumber, state.map, gameModeLabel(), players].join('|');
  }

  function renderStatsIfChanged() {
    var view = document.getElementById('statsView');
    if (!view) return;
    var key = statsShellKey();
    if (!view.querySelector('[data-field="health"]') || key !== statsStructureKey) {
      renderStats();
      statsStructureKey = key;
      statsContentKey = collectStatsContentKey();
      perf.statsFull += 1;
      var card = view.querySelector('.impact-card');
      if (card) card.setAttribute('data-impact-sig', impactSignature(displayImpactBoard().local));
      return;
    }
    var content = collectStatsContentKey();
    if (content === statsContentKey) return;
    patchStats(view);
    statsContentKey = content;
    perf.statsPatch += 1;
  }

  function patchScoreboard(view) {
    var impact = displayImpactBoard();
    var score = scoreText();
    setText(view, 'score-left', score.left === EMPTY ? null : score.left);
    setText(view, 'score-right', score.right === EMPTY ? null : score.right);
    var mapLine = view.querySelector('[data-field="score-mapline"]');
    if (mapLine) {
      var nextLine = headerMapLine();
      if (mapLine.textContent !== nextLine) mapLine.textContent = nextLine;
    }
    var roundTag = view.querySelector('.score-tags [data-field="round-tag"]');
    if (roundTag) roundTag.textContent = state.roundNumber != null ? ('Round ' + state.roundNumber) : '';
    view.querySelectorAll('.player-row').forEach(function (row) {
      var player = state.players[row.getAttribute('data-player-id')];
      if (!player) return;
      row.className = 'player-row' + (player.alive === false ? ' dead' : '') + (player.isLocal ? ' is-you' : '');
      setText(row, 'name', player.name);
      var meta = playerSubtext(player);
      setText(row, 'meta', meta || null);
      setText(row, 'kills', player.kills);
      setText(row, 'deaths', player.deaths);
      setText(row, 'assists', player.assists);
      var impactNode = row.querySelector('[data-field="impact"]');
      var entry = impact && impact.byId ? impact.byId[player.id] : null;
      var label = !entry || !entry.ready ? (!entry || entry.pending ? '…' : '--') : String(entry.label);
      if (impactNode && impactNode.textContent !== label) impactNode.textContent = label;
      var img = row.querySelector('img');
      var src = agentIcon(player.agent);
      if (img && src && img.getAttribute('src') !== src) {
        img.setAttribute('src', src);
        applyAgentIconFallback(img);
      }
    });
  }

  function renderScoreboardIfChanged() {
    var view = document.getElementById('scoreboardView');
    if (!view) return;
    var key = rosterKey();
    if (!view.querySelector('[data-field="score-left"]') || key !== boardStructureKey) {
      renderScoreboard();
      boardStructureKey = key;
      boardContentKey = scoreboardContentKey();
      perf.boardFull += 1;
      return;
    }
    var content = scoreboardContentKey();
    if (content === boardContentKey) return;
    patchScoreboard(view);
    boardContentKey = content;
    perf.boardPatch += 1;
  }

  function renderRecommendationsIfChanged() {
    var view = document.getElementById('recommendationsView');
    if (!view) return;
    var sig = recommendationSignature();
    if (sig === recSignature && view.childNodes.length) return;
    renderRecommendations();
    recSignature = sig;
    perf.recRender += 1;
  }

  function paintOverlay(force) {
    if (!overlayVisible) {
      overlayDirty = true;
      perf.paintsSkippedHidden += 1;
      return;
    }
    overlayDirty = false;
    if (force) {
      statsStructureKey = '';
      statsContentKey = '';
      boardStructureKey = '';
      boardContentKey = '';
      recSignature = '';
    }
    renderStatsIfChanged();
    renderScoreboardIfChanged();
    renderRecommendationsIfChanged();
  }

  function schedulePaint() {
    perf.gep += 1;
    maybeLogPerf();
    if (!overlayVisible) {
      overlayDirty = true;
      perf.paintsSkippedHidden += 1;
      return;
    }
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(function () {
      paintQueued = false;
      paintOverlay(false);
    });
  }

  function render() {
    paintOverlay(true);
  }

  window.SpikeCoachPerf = perf;

  function renderStats(impact) {
    var view = document.getElementById('statsView');
    if (!view) return;
    impact = impact || displayImpactBoard();
    var local = localPlayer();
    var agent = (local && local.agent) || state.local.agent;
    var name = (local && local.name) || state.local.name;
    var kills = local && local.kills != null ? local.kills : state.killTotals.kills;
    var deaths = local && local.deaths != null ? local.deaths : state.deathTotal;
    var assists = local && local.assists != null ? local.assists : state.killTotals.assists;
    var weapon = local && showLoadout(local) ? weaponName(local.weapon) : null;
    var shield = local && showEconomy(local) ? shieldName(local.shield) : null;
    var ult = null;
    if (local && local.ultPoints != null) {
      ult = local.ultMax != null ? (local.ultPoints + ' / ' + local.ultMax) : String(local.ultPoints);
    }
    var credits = local && showEconomy(local) && local.credits != null ? formatCredits(local.credits) : null;
    var health = state.local.health;
    var healthPct = health == null ? 0 : Math.max(0, Math.min(100, health));
    var healthClass = health == null ? '' : (health <= 30 ? ' low' : (health <= 60 ? ' mid' : ''));
    var ultPct = local && local.ultPoints != null && local.ultMax ? Math.max(0, Math.min(100, local.ultPoints / local.ultMax * 100)) : 0;
    var hsPercent = headshotPercentLabel();
    var side = sideForPlayer(local || { isLocal: true });

    var mapBg = mapLoadingSrc();
    view.innerHTML =
      '<div class="stat-hero' + (mapBg ? ' has-map' : '') + '"' +
        (mapBg ? ' style="background-image:url(\'' + escapeHtml(mapBg) + '\')"' : '') + '>' +
        (agent ? '<img class="agent-portrait" data-field="agent-portrait" src="' + escapeHtml(agentIcon(agent)) + '" alt="">' : '<div class="agent-portrait" data-field="agent-portrait"></div>') +
        '<div class="hero-text"><div class="hero-name" data-field="agent">' + escapeHtml(dash(agent)) + '</div><div class="hero-side" data-field="player-name">' + escapeHtml(dash(name)) + '</div>' +
        '<div class="hero-side" data-field="hero-map">' + escapeHtml(state.map ? mapLabel() : '') + '</div></div>' +
        '<div class="hero-health"><div class="hero-health-top"><span class="mini-label">Health</span><span class="hero-health-value' + healthClass + '" data-field="health">' + escapeHtml(dash(health)) + '</span></div>' +
        '<div class="bar"><div class="bar-fill health' + healthClass + '" data-field="health-bar" style="width:' + healthPct + '%"></div></div></div>' +
      '</div>' +
      impactCardHtml(impact.local) +
      '<div class="kda-row">' +
        bigStatHtml('Kills', kills, 'kills') +
        bigStatHtml('Deaths', deaths, 'deaths') +
        bigStatHtml('Assists', assists, 'assists') +
      '</div>' +

      '<div class="hs-row">' +
        '<div class="hs-card hs-main"><div class="big-label">Headshot %</div><div class="hs-value" data-field="hs-percent">' + escapeHtml(dash(hsPercent)) + '</div>' +
          '<div class="hs-note">Head hits divided by bullet hits this match</div></div>' +
        '<div class="hs-card"><div class="big-label">Headshots</div><div class="hs-value small" data-field="headshots">' + escapeHtml(dash(state.killTotals.headshots)) + '</div>' +
          '<div class="hs-note">Match total</div></div>' +
      '</div>' +

      '<div class="section-title">Loadout</div>' +
      '<div class="loadout-row">' +
        miniStatHtml('Weapon', weapon, 'weapon') +
        miniStatHtml('Shield', shield, 'shield') +
        miniStatHtml('Credits', credits, 'credits') +
        '<div class="mini-stat"><div class="mini-label">Ultimate</div><div class="mini-value" data-field="ult">' + escapeHtml(dash(ult)) + '</div>' +
          '<div class="bar thin"><div class="bar-fill ult" data-field="ult-bar" style="width:' + ultPct + '%"></div></div></div>' +
      '</div>' +

      '<div class="section-title">Abilities</div>' +
      '<div class="ability-row">' + abilityHtml(agent, state.local.abilities) + '</div>' +

      roundReportHtml() +

      '<div class="section-title">Match</div>' +
      '<div class="match-strip">' +
        miniStatHtml('Mode', gameModeLabel(), 'mode') +
        miniStatHtml('Map', state.map ? mapLabel() : null, 'map') +
        miniStatHtml('Side', side, 'side') +
        miniStatHtml('Round', state.roundNumber, 'round') +
        miniStatHtml('Score', matchScoreLabel(), 'score') +
      '</div>';
    var portrait = view.querySelector('[data-field="agent-portrait"]');
    if (portrait && portrait.tagName === 'IMG') applyAgentIconFallback(portrait);
  }

  function impactCardHtml(result) {
    var score = result && result.ready
      ? '<div class="impact-score">' + escapeHtml(result.label) + '<span>/ 10</span></div>'
      : '<div class="impact-score pending">Calculating...</div>';
    var bars = (result && result.categories || []).map(function (category) {
      var width = category.score == null ? 0 : Math.max(0, Math.min(100, category.score * 10));
      return '<div class="impact-bar-row"><span>' + escapeHtml(category.label) + '</span>' +
        '<b>' + escapeHtml(category.score == null ? '--' : category.score.toFixed(1)) + '</b>' +
        '<div class="bar thin"><div class="bar-fill impact" style="width:' + width + '%"></div></div></div>';
    }).join('');
    return '<section class="impact-card">' +
      '<div class="impact-head"><span class="big-label">Impact Rating</span>' +
      '<button type="button" class="impact-info" aria-describedby="impactTip">i</button></div>' +
      score +
      '<p class="impact-tip" id="impactTip">SpikeCoach uses personalized VALORANT statistics to give a score based on your impact to the team.</p>' +
      (result && result.ready ? '<div class="impact-bars">' + bars + '</div>' : '') +
      '<p class="impact-disclaimer">Impact Rating is a SpikeCoach metric and is not an official Riot Games statistic.</p>' +
      '</section>';
  }

  function impactCellHtml(player, impact) {
    var entry = impact && impact.byId ? impact.byId[player.id] : null;
    var tip = 'Calculated from the match data available for this player.';
    if (!entry || !entry.ready) {
      var pending = !entry || entry.pending;
      return '<div class="impact-cell pending" data-field="impact" title="' + escapeHtml(pending ? 'Calculating...' : tip) + '">' +
        (pending ? '…' : '--') + '</div>';
    }
    return '<div class="impact-cell" data-field="impact" title="' + escapeHtml(tip) + '">' + escapeHtml(entry.label) + '</div>';
  }

  function bigStatHtml(label, value, kind) {
    return '<div class="big-stat ' + kind + '"><div class="big-label">' + escapeHtml(label) + '</div>' +
      '<div class="big-value" data-field="' + kind + '">' + escapeHtml(dash(value)) + '</div></div>';
  }

  function miniStatHtml(label, value, field) {
    return '<div class="mini-stat"><div class="mini-label">' + escapeHtml(label) + '</div>' +
      '<div class="mini-value"' + (field ? ' data-field="' + field + '"' : '') + '>' + escapeHtml(dash(value)) + '</div></div>';
  }

  // Headshot share of hits, summed over completed rounds' round_report data. Not invented: null until data exists.
  function headshotPercentLabel() {
    if (!state.matchTotalHits) return null;
    return (Math.round(state.matchHeadHits / state.matchTotalHits * 1000) / 10).toFixed(1) + '%';
  }

  function roundReportValue(report, key) {
    if (!report || report[key] == null || report[key] === '') return null;
    return report[key];
  }

  function roundReportHtml() {
    var report = state.roundReport;
    function num(key) { return asNumber(roundReportValue(report, key)); }
    function show(key) {
      var value = num(key);
      return value == null ? null : (Math.round(value * 10) / 10);
    }
    var head = (num('headshot') || 0) + (num('final_headshot') || 0);
    var hasHead = num('headshot') != null || num('final_headshot') != null;
    var body = num('bodyshots');
    var leg = num('legshots');
    var spread = (hasHead ? head : 0) + (body || 0) + (leg || 0);
    var bar = '';
    if (spread > 0) {
      bar = '<div class="hit-bar">' +
        '<span class="hit-seg head" data-field="hit-head" style="width:' + (head / spread * 100) + '%"></span>' +
        '<span class="hit-seg body" data-field="hit-body" style="width:' + ((body || 0) / spread * 100) + '%"></span>' +
        '<span class="hit-seg leg" data-field="hit-leg" style="width:' + ((leg || 0) / spread * 100) + '%"></span></div>';
    }
    function legend(cls, label, value) {
      return '<span class="hit-legend ' + cls + '"><i></i>' + escapeHtml(label) + ' <b data-field="legend-' + cls + '">' + escapeHtml(dash(value)) + '</b></span>';
    }
    return '<section class="round-report"><div class="section-title">Last Round' +
      '<span class="section-tag" data-field="round-tag">' + (state.roundNumber != null ? 'Round ' + escapeHtml(state.roundNumber) : '') + '</span></div>' +
      '<div class="damage-row">' +
        '<div class="damage-card dealt"><div class="big-label">Damage dealt</div><div class="damage-value" data-field="damage">' + escapeHtml(dash(show('damage'))) + '</div></div>' +
        '<div class="damage-card taken"><div class="big-label">Damage received</div><div class="damage-value" data-field="damage-received">' + escapeHtml(dash(show('damage_received'))) + '</div></div>' +
      '</div>' +
      '<div class="hit-panel">' +
        '<div class="hit-panel-top"><span class="mini-label">Hit placement</span><span class="mini-label">Hits <b data-field="hits">' + escapeHtml(dash(show('hit'))) + '</b></span></div>' +
        (bar || '<div class="hit-bar empty"></div>') +
        '<div class="hit-legends">' +
          legend('head', 'Head', hasHead ? head : null) +
          legend('body', 'Body', body) +
          legend('leg', 'Leg', leg) +
        '</div>' +
      '</div>' +
      '<div class="round-mini-row">' +
        miniStatHtml('Killing headshots', show('final_headshot'), 'final-headshot') +
        miniStatHtml('Hits received', show('hits_received'), 'hits-received') +
        miniStatHtml('Ability damage', show('ability_damage'), 'ability-damage') +
      '</div></section>';
  }

  function abilityHtml(agent, abilities) {
    var manifest = window.AGENT_ABILITY_MANIFEST && agent && window.AGENT_ABILITY_MANIFEST[agent];
    if (!manifest) return '<div class="empty">Ability icons appear when your agent is known.</div>';
    return manifest.filter(function (ability) {
      return ability.label === 'C' || ability.label === 'Q' || ability.label === 'E' || ability.label === 'X';
    }).map(function (ability) {
      var ready = abilities && abilities[ability.label] === true;
      var unavailable = abilities && abilities[ability.label] === false;
      var status = ready ? 'Ready' : (unavailable ? 'Unavailable' : '--');
      var stateClass = ready ? ' ready' : (unavailable ? ' unavailable' : '');
      return '<div class="ability' + stateClass + '" data-ability="' + escapeHtml(ability.label) + '" title="' + escapeHtml(ability.label + ' ' + status) + '">' +
        '<img src="' + escapeHtml(ability.src) + '" alt="' + escapeHtml(ability.label) + '">' +
        '<span class="ability-key">' + escapeHtml(ability.label) + '</span>' +
        '<span class="ability-state" data-field="ability-' + escapeHtml(ability.label) + '">' + escapeHtml(status) + '</span></div>';
    }).join('');
  }

  function scoreText() {
    var score = state.matchScore;
    if (!score) return { left: EMPTY, right: EMPTY };
    if (score.won != null || score.lost != null) return { left: dash(score.won), right: dash(score.lost) };
    if (score.team_0 != null || score.team_1 != null) return { left: dash(score.team_0), right: dash(score.team_1) };
    return { left: EMPTY, right: EMPTY };
  }

  function teamHtml(title, side, players, className, impact) {
    var rows = players.map(function (player) {
      var classes = 'player-row' + (player.alive === false ? ' dead' : '') + (player.isLocal ? ' is-you' : '');
      var subtext = playerSubtext(player);
      return '<div class="' + classes + '" data-player-id="' + escapeHtml(player.id) + '">' +
        '<img src="' + escapeHtml(agentIcon(player.agent)) + '" alt="">' +
        '<div class="player-main"><div class="player-name"><span data-field="name">' + escapeHtml(dash(player.name)) + '</span>' +
          (player.isLocal ? '<span class="you-tag">You</span>' : '') + '</div>' +
        '<div class="player-meta" data-field="meta">' + escapeHtml(subtext || EMPTY) + '</div></div>' +
        '<div class="kda-cell kills" data-field="kills">' + escapeHtml(dash(player.kills)) + '</div>' +
        '<div class="kda-cell deaths" data-field="deaths">' + escapeHtml(dash(player.deaths)) + '</div>' +
        '<div class="kda-cell assists" data-field="assists">' + escapeHtml(dash(player.assists)) + '</div>' +
        impactCellHtml(player, impact) + '</div>';
    }).join('');
    return '<div class="team ' + className + '">' +
      '<div class="team-top"><span class="team-header">' + escapeHtml(title) + '</span>' +
      '<span class="team-side">' + escapeHtml(side || EMPTY) + '</span></div>' +
      '<div class="team-cols"><span>Player</span><span>K</span><span>D</span><span>A</span><span>IR</span></div>' +
      (rows || '<div class="empty">Waiting for roster.</div>') + '</div>';
  }

  function renderScoreboard(impact) {
    var view = document.getElementById('scoreboardView');
    if (!view) return;
    impact = impact || displayImpactBoard();
    var players = playerList();
    var allies = players.filter(function (player) { return player.teammate !== false; });
    var enemies = players.filter(function (player) { return player.teammate === false; });
    var score = scoreText();
    var allySide = sideForPlayer({ isLocal: true });
    var enemySide = allySide === 'Attack' ? 'Defense' : (allySide === 'Defense' ? 'Attack' : EMPTY);
    var detail = '';
    if (selectedPlayerId && state.players[selectedPlayerId]) detail = detailHtml(state.players[selectedPlayerId]);
    var modeLabel = gameModeLabel();
    var mapBg = mapLoadingSrc();
    view.innerHTML =
      '<div class="score-container' + (mapBg ? ' has-map' : '') + '"' +
        (mapBg ? ' style="background-image:url(\'' + escapeHtml(mapBg) + '\')"' : '') + '>' +
      '<div class="score-side blue"><div class="score-label">Your team</div><div class="score-number" data-field="score-left">' + escapeHtml(score.left) + '</div></div>' +
      '<div class="score-middle"><div class="score-divider">VS</div></div>' +
      '<div class="score-side red"><div class="score-label">Opponents</div><div class="score-number" data-field="score-right">' + escapeHtml(score.right) + '</div></div>' +
      '<div class="score-mapline" data-field="score-mapline">' + escapeHtml(headerMapLine()) + '</div></div>' +
      '<div class="score-tags"><span class="score-tag">' + escapeHtml(mapLabel()) + '</span>' +
        (modeLabel ? '<span class="score-tag">' + escapeHtml(modeLabel) + '</span>' : '') +
        '<span class="score-tag" data-field="round-tag">' + (state.roundNumber != null ? 'Round ' + escapeHtml(state.roundNumber) : '') + '</span></div>' +
      '<div class="teams">' + teamHtml('Your team', allySide, allies, 'allies', impact) + teamHtml('Opponents', enemySide, enemies, 'enemies', impact) + '</div>' +
      '<p class="impact-disclaimer scoreboard-note">Impact Rating is a SpikeCoach metric and is not an official Riot Games statistic.</p>' +
      detail;
    view.querySelectorAll('.player-row').forEach(function (row) {
      row.addEventListener('click', function () {
        selectedPlayerId = row.getAttribute('data-player-id');
        paintOverlay(false);
      });
    });
    var back = document.getElementById('detailBack');
    if (back) back.addEventListener('click', function () { selectedPlayerId = null; paintOverlay(false); });
    view.querySelectorAll('.player-row img, .detail-icon').forEach(applyAgentIconFallback);
  }

  function duelsFor(name, asAttacker) {
    var lines = [];
    if (asAttacker) {
      var victims = state.killInteractions[name] || {};
      Object.keys(victims).forEach(function (victim) {
        lines.push(name + ' eliminated ' + victim + ' ' + victims[victim] + ' time' + (victims[victim] === 1 ? '' : 's'));
      });
      return lines;
    }
    Object.keys(state.killInteractions).forEach(function (attacker) {
      var count = state.killInteractions[attacker][name];
      if (count) lines.push(attacker + ' eliminated ' + name + ' ' + count + ' time' + (count === 1 ? '' : 's'));
    });
    return lines;
  }

  function detailHtml(player) {
    var name = player.name || '';
    var kills = duelsFor(name, true);
    var deaths = duelsFor(name, false);
    function duelList(lines, emptyText) {
      if (!lines.length) return '<div class="duel-empty">' + escapeHtml(emptyText) + '</div>';
      return lines.map(function (line) { return '<div class="duel-line">' + escapeHtml(line) + '</div>'; }).join('');
    }
    return '<div class="detail"><div class="detail-top">' +
      '<img class="detail-icon" src="' + escapeHtml(agentIcon(player.agent)) + '" alt="">' +
      '<div class="detail-title"><h2>' + escapeHtml(dash(player.name)) + '</h2><div class="player-meta">' + escapeHtml(dash(player.agent)) + '</div></div>' +
      '<button class="back-btn" id="detailBack" type="button">Back</button></div>' +
      '<div class="detail-kda">' +
        '<div class="detail-stat kills"><b>' + escapeHtml(dash(player.kills)) + '</b><span>Kills</span></div>' +
        '<div class="detail-stat deaths"><b>' + escapeHtml(dash(player.deaths)) + '</b><span>Deaths</span></div>' +
        '<div class="detail-stat assists"><b>' + escapeHtml(dash(player.assists)) + '</b><span>Assists</span></div></div>' +
      '<div class="duel-list"><h3>Eliminations this match</h3>' + duelList(kills, 'No kill-feed eliminations recorded yet.') +
      '<h3>Deaths this match</h3>' + duelList(deaths, 'No kill-feed deaths recorded yet.') + '</div></div>';
  }

  function renderRecommendations() {
    var view = document.getElementById('recommendationsView');
    if (!state.postgameGenerated) {
      view.innerHTML = recEmptyHtml('Review unlocks after the match',
        'Your post-match recommendations appear here once this game ends.');
      return;
    }
    if (!state.recommendations.length) {
      view.innerHTML = recEmptyHtml('Not enough data this match',
        'No recommendation had enough recorded data from this match.');
      return;
    }
    view.innerHTML =
      '<div class="rec-header"><div><div class="rec-header-title">Post-match review</div>' +
      '<div class="rec-header-sub">Based on data recorded during this match</div></div>' +
      '<div class="rec-count">' + state.recommendations.length + '</div></div>' +
      state.recommendations.map(function (rule, index) {
        return '<article class="rec-card cat-' + categoryClass(rule.category) + '">' +
          '<div class="rec-top"><span class="rec-number">' + (index + 1) + '</span>' +
          '<span class="rec-category">' + escapeHtml(rule.category) + '</span></div>' +
          '<div class="rec-title">' + escapeHtml(rule.title) + '</div>' +
          '<div class="rec-text">' + escapeHtml(rule.message) + '</div>' +
          '<div class="rec-evidence"><span>Data</span>' + escapeHtml(rule.evidence) + '</div></article>';
      }).join('');
  }

  function categoryClass(category) {
    return String(category || 'general').toLowerCase().replace(/[^a-z]+/g, '-');
  }

  function recEmptyHtml(title, text) {
    return '<div class="state-card"><div class="state-ring"></div>' +
      '<div class="state-title">' + escapeHtml(title) + '</div>' +
      '<div class="state-text">' + escapeHtml(text) + '</div></div>';
  }

  document.querySelectorAll('.nav-tab').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.nav-tab').forEach(function (tab) { tab.classList.remove('active'); });
      document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
      button.classList.add('active');
      document.getElementById('page-' + button.getAttribute('data-page')).classList.add('active');
    });
  });

  function startGep() {
    if (!window.overwolf || !overwolf.games || !overwolf.games.events) return;
    overwolf.games.events.onInfoUpdates2.addListener(applyInfoPayload);
    overwolf.games.events.onNewEvents.addListener(function (payload) {
      ((payload && payload.events) || []).forEach(onGameEvent);
    });
    overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, function () {
      requestOverlaySnapshot('features-ready');
    });
  }

  // Width stays fixed. Height can change between these limits. Manifest min_size/max_size match them.
  var SPIKECOACH_WINDOW_WIDTH = 688;
  var SPIKECOACH_WINDOW_MIN_HEIGHT = 420;
  var SPIKECOACH_WINDOW_MAX_HEIGHT = 770;
  var SPIKECOACH_WINDOW_HEIGHT_KEY = 'spikecoach_overlay_height';

  function clampWindowHeight(height) {
    var available = window.screen && window.screen.availHeight ? window.screen.availHeight - 40 : SPIKECOACH_WINDOW_MAX_HEIGHT;
    var maxHeight = Math.max(SPIKECOACH_WINDOW_MIN_HEIGHT, Math.min(SPIKECOACH_WINDOW_MAX_HEIGHT, available));
    var number = Number(height);
    if (!number || isNaN(number)) return null;
    return Math.max(SPIKECOACH_WINDOW_MIN_HEIGHT, Math.min(maxHeight, Math.round(number)));
  }

  function readSavedWindowHeight() {
    try {
      return clampWindowHeight(localStorage.getItem(SPIKECOACH_WINDOW_HEIGHT_KEY));
    } catch (error) {
      return null;
    }
  }

  function writeSavedWindowHeight(height) {
    var next = clampWindowHeight(height);
    if (next == null) return;
    try {
      localStorage.setItem(SPIKECOACH_WINDOW_HEIGHT_KEY, String(next));
    } catch (error) {}
  }

  var cachedOverlayWindow = null;
  var resizeFinishBound = false;

  function rememberOverlayWindow(win) {
    if (!win || !win.id) return;
    if (!cachedOverlayWindow) cachedOverlayWindow = { id: win.id, width: win.width, height: win.height };
    else {
      cachedOverlayWindow.id = win.id;
      if (win.width != null) cachedOverlayWindow.width = win.width;
      if (win.height != null) cachedOverlayWindow.height = win.height;
    }
    var shown = win.stateEx || win.state;
    if (shown) noteOverlayVisibility(shown, false);
  }

  function noteOverlayVisibility(stateName, paintIfShown) {
    var visible = stateName === 'normal' || stateName === 'maximized';
    var becameVisible = visible && !overlayVisible;
    overlayVisible = visible;
    if (paintIfShown && visible && (becameVisible || overlayDirty)) paintOverlay(true);
  }

  function withOverlayWindow(callback) {
    if (cachedOverlayWindow && cachedOverlayWindow.id) {
      callback(cachedOverlayWindow);
      return;
    }
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.getCurrentWindow) {
      callback(null);
      return;
    }
    overwolf.windows.getCurrentWindow(function (result) {
      rememberOverlayWindow(result && result.window);
      callback(cachedOverlayWindow);
    });
  }

  function applyWindowSize(width, height, callback) {
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.changeSize) {
      if (callback) callback(false);
      return;
    }
    withOverlayWindow(function (win) {
      if (!win || !win.id) {
        if (callback) callback(false);
        return;
      }
      var nextHeight = clampWindowHeight(height);
      if (nextHeight == null) nextHeight = win.height;
      if (win.width === width && win.height === nextHeight) {
        if (callback) callback(true);
        return;
      }
      var params = { window_id: win.id, width: width, height: nextHeight };
      function remember(ok) {
        if (ok) {
          win.width = width;
          win.height = nextHeight;
        }
        if (callback) callback(ok);
      }
      overwolf.windows.changeSize(params, function (resize) {
        if (resize && resize.success) {
          remember(true);
          return;
        }
        overwolf.windows.changeSize(win.id, width, nextHeight, function (fallback) {
          remember(!!(fallback && fallback.success));
        });
      });
    });
  }

  function persistCurrentWindowHeight() {
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.getCurrentWindow) return;
    overwolf.windows.getCurrentWindow(function (result) {
      var win = result && result.window;
      if (!win || win.height == null) return;
      rememberOverlayWindow(win);
      writeSavedWindowHeight(win.height);
      if (win.width !== SPIKECOACH_WINDOW_WIDTH) {
        applyWindowSize(SPIKECOACH_WINDOW_WIDTH, win.height);
      }
    });
  }

  function dragResizeBottom() {
    if (resizeFinishBound) return;
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.dragResize) return;
    withOverlayWindow(function (win) {
      if (!win || !win.id || resizeFinishBound) return;
      var edges = overwolf.windows.enums && overwolf.windows.enums.WindowDragEdge;
      var edge = edges && edges.Bottom != null ? edges.Bottom : 'Bottom';
      resizeFinishBound = true;
      function finishResize() {
        if (!resizeFinishBound) return;
        resizeFinishBound = false;
        window.removeEventListener('mouseup', finishResize);
        persistCurrentWindowHeight();
      }
      window.addEventListener('mouseup', finishResize, { once: true });
      overwolf.windows.dragResize(win.id, edge, null, finishResize);
    });
  }

  var resizeHandle = document.getElementById('resizeHandle');
  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      dragResizeBottom();
    });
  }

  var savedHeight = readSavedWindowHeight();
  withOverlayWindow(function () {
    applyWindowSize(SPIKECOACH_WINDOW_WIDTH, savedHeight != null ? savedHeight : SPIKECOACH_WINDOW_MAX_HEIGHT);
  });

  var OVERLAY_HOTKEY_STORAGE_KEY = 'spikecoach_overlay_hotkey';
  var OVERLAY_HOTKEY_LABELS = {
    'ctrl-shift-k': 'Ctrl + Shift + K',
    'ctrl-shift-l': 'Ctrl + Shift + L',
    'ctrl-shift-j': 'Ctrl + Shift + J',
    'ctrl-shift-m': 'Ctrl + Shift + M'
  };

  function overlayHotkeyLabel() {
    var id = 'ctrl-shift-k';
    try {
      var stored = localStorage.getItem(OVERLAY_HOTKEY_STORAGE_KEY);
      if (stored && OVERLAY_HOTKEY_LABELS[stored]) id = stored;
    } catch (error) {}
    return OVERLAY_HOTKEY_LABELS[id];
  }

  function renderHotkeyHint() {
    var hint = document.getElementById('hotkeyHint');
    if (!hint) return;
    hint.innerHTML = 'Press <kbd>' + overlayHotkeyLabel() + '</kbd> to show or hide';
  }

  window.addEventListener('storage', function (event) {
    if (!event || event.key === OVERLAY_HOTKEY_STORAGE_KEY) renderHotkeyHint();
  });
  if (window.overwolf && overwolf.windows && overwolf.windows.onStateChanged) {
    overwolf.windows.onStateChanged.addListener(function (event) {
      if (!event || (event.window_name && event.window_name !== 'SpikeCoachTab')) return;
      var state = event.window_state_ex || event.window_state;
      if (!state) return;
      noteOverlayVisibility(state, true);
      if (state === 'normal' || state === 'maximized') renderHotkeyHint();
    });
  }
  renderHotkeyHint();

  render();
  startGep();
})();
