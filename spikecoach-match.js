(function () {
  var REQUIRED_FEATURES = ['match_info', 'game_info', 'me', 'kill', 'death'];
  var EMPTY = '--';
  var SUBTEXT_SEP = ' \u00B7 ';

  var AGENT_NAMES = {
    Clay: 'Raze', Clay_PC_C: 'Raze',
    Pandemic: 'Viper', Pandemic_PC_C: 'Viper',
    Wraith: 'Omen', Wraith_PC_C: 'Omen',
    Hunter: 'Sova', Hunter_PC_C: 'Sova',
    Thorne: 'Sage', Thorne_PC_C: 'Sage',
    Phoenix: 'Phoenix', Phoenix_PC_C: 'Phoenix',
    Wushu: 'Jett', Wushu_PC_C: 'Jett',
    Gumshoe: 'Cypher', Gumshoe_PC_C: 'Cypher',
    Sarge: 'Brimstone', Sarge_PC_C: 'Brimstone',
    Breach: 'Breach', Breach_PC_C: 'Breach',
    Vampire: 'Reyna', Vampire_PC_C: 'Reyna',
    Killjoy: 'Killjoy', Killjoy_PC_C: 'Killjoy',
    Guide: 'Skye', Guide_PC_C: 'Skye',
    Stealth: 'Yoru', Stealth_PC_C: 'Yoru',
    Rift: 'Astra', Rift_PC_C: 'Astra',
    Grenadier: 'KAY/O', Grenadier_PC_C: 'KAY/O',
    Deadeye: 'Chamber', Deadeye_PC_C: 'Chamber',
    Sprinter: 'Neon', Sprinter_PC_C: 'Neon',
    BountyHunter: 'Fade', BountyHunter_PC_C: 'Fade',
    Mage: 'Harbor', Mage_PC_C: 'Harbor',
    AggroBot: 'Gekko', AggroBot_PC_C: 'Gekko',
    Cable: 'Deadlock', Cable_PC_C: 'Deadlock',
    Sequoia: 'Iso', Sequoia_PC_C: 'Iso',
    Smonk: 'Clove', Smonk_PC_C: 'Clove',
    Nox: 'Vyse', Nox_PC_C: 'Vyse',
    Cashew: 'Tejo', Cashew_PC_C: 'Tejo',
    Terra: 'Waylay', Terra_PC_C: 'Waylay'
  };

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

  var PISTOLS = { Classic: true, Shorty: true, Frenzy: true, Ghost: true, Sheriff: true };

  // Add future rules to this list. enabled: false keeps the shape without firing.
  // The engine runs once after the match, keeps the highest priority rule in each group, and shows 3.
  var RECOMMENDATION_RULES = [
    {
      id: 'crosshair-placement',
      category: 'Dueling',
      group: 'aim-quality',
      priority: 90,
      enabled: true,
      minimumData: function (stats) {
        return stats.hits != null && stats.headshots != null && stats.hits >= 15 && stats.hitSamples >= 4;
      },
      conditions: function (stats) { return stats.headshots / stats.hits < 0.15; },
      title: 'Work on Crosshair Placement',
      message: function () {
        return 'Across the rounds recorded in this match, a small share of your hits were headshots. Review where the crosshair sat before those fights.';
      },
      evidence: function (stats) {
        return 'round_report: ' + stats.headshots + ' headshots out of ' + stats.hits + ' hits over ' + stats.hitSamples + ' rounds.';
      }
    },
    {
      id: 'solid-headshot-share',
      category: 'Dueling',
      group: 'aim-quality',
      priority: 36,
      enabled: true,
      minimumData: function (stats) {
        return stats.hits != null && stats.headshots != null && stats.hits >= 15 && stats.hitSamples >= 4;
      },
      conditions: function (stats) { return stats.headshots / stats.hits >= 0.28; },
      title: 'Headshot Share Was Solid',
      message: function () {
        return 'A solid share of the hits recorded this match were headshots. That first-bullet accuracy is worth keeping.';
      },
      evidence: function (stats) {
        return 'round_report: ' + stats.headshots + ' headshots out of ' + stats.hits + ' hits over ' + stats.hitSamples + ' rounds.';
      }
    },
    {
      id: 'stay-alive-longer',
      category: 'Survivability',
      group: 'duel-outcome',
      priority: 86,
      enabled: true,
      minimumData: function (stats) {
        return stats.kills != null && stats.deaths != null && stats.deaths >= 8 && (stats.kills + stats.deaths) >= 10;
      },
      conditions: function (stats) { return stats.deaths > stats.kills; },
      title: 'Prioritize Staying Alive Longer',
      message: function () {
        return 'Deaths finished higher than eliminations. Review which fights could have been left, or taken with a teammate already in the fight.';
      },
      evidence: function (stats) {
        return 'Scoreboard: ' + stats.kills + ' kills and ' + stats.deaths + ' deaths.';
      }
    },
    {
      id: 'eliminations-ahead',
      category: 'Dueling',
      group: 'duel-outcome',
      priority: 40,
      enabled: true,
      minimumData: function (stats) {
        return stats.kills != null && stats.deaths != null && stats.kills >= 10;
      },
      conditions: function (stats) { return stats.kills >= stats.deaths + 4; },
      title: 'Eliminations Outpaced Deaths',
      message: function () {
        return 'Eliminations finished clearly ahead of deaths. The duel results from this match were a strength.';
      },
      evidence: function (stats) {
        return 'Scoreboard: ' + stats.kills + ' kills and ' + stats.deaths + ' deaths.';
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
        return 'Recorded damage taken was higher than damage dealt. Review the fights where you absorbed shots before you could trade them.';
      },
      evidence: function (stats) {
        return 'round_report: ' + Math.round(stats.damage) + ' damage dealt and ' + Math.round(stats.damageReceived) + ' damage received.';
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
        return 'Recorded damage dealt stayed ahead of damage taken. The trades in this match favored you.';
      },
      evidence: function (stats) {
        return 'round_report: ' + Math.round(stats.damage) + ' damage dealt and ' + Math.round(stats.damageReceived) + ' damage received.';
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
        return 'Opponents landed more recorded hits on you than you landed on them. Review the openings where you were shot first.';
      },
      evidence: function (stats) {
        return 'round_report: ' + stats.hitsDealt + ' hits dealt and ' + stats.hitsReceived + ' hits received.';
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
      title: 'Utility Did Not Deal Damage',
      message: function () {
        return 'Abilities dealt no recorded damage across the sampled rounds. Review whether utility was used to affect those fights.';
      },
      evidence: function (stats) {
        return 'round_report ability_damage: 0 across ' + stats.abilitySamples + ' rounds.';
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
      title: 'Effective Utility Damage',
      message: function () {
        return 'Abilities accounted for a meaningful share of recorded damage. That utility output helped the rounds that were sampled.';
      },
      evidence: function (stats) {
        return 'round_report ability_damage: ' + Math.round(stats.abilityDamage) + ' across ' + stats.abilitySamples + ' rounds.';
      }
    },
    {
      id: 'assists-at-zero',
      category: 'Teamplay',
      group: 'assist-rate',
      priority: 60,
      enabled: true,
      minimumData: function (stats) {
        return stats.assists != null && stats.kills != null && stats.deaths != null && (stats.kills + stats.deaths) >= 8;
      },
      conditions: function (stats) { return stats.assists === 0; },
      title: 'Assists Stayed at Zero',
      message: function () {
        return 'The match ended with no recorded assists. Review how often those eliminations and deaths happened beside a teammate.';
      },
      evidence: function (stats) {
        return 'Scoreboard: ' + stats.assists + ' assists, ' + stats.kills + ' kills, ' + stats.deaths + ' deaths.';
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
        return stats.kills === 0 || stats.assists / stats.kills >= 0.45;
      },
      title: 'Strong Team Contribution',
      message: function () {
        return 'Assists stayed high relative to your own eliminations. Teammates were getting credit on the fights you were in.';
      },
      evidence: function (stats) {
        return 'Scoreboard: ' + stats.assists + ' assists and ' + stats.kills + ' kills.';
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
        return 'The last recorded credit total was low after a match with many deaths. This is the closing balance only, not a round-by-round buy log.';
      },
      evidence: function (stats) {
        return 'Scoreboard money: ' + stats.credits + ' credits at the last update, with ' + stats.deaths + ' deaths.';
      }
    },
    {
      id: 'strong-mid-match-adjustment',
      category: 'Consistency',
      group: 'half-trend',
      priority: 50,
      enabled: true,
      minimumData: function (stats) { return halfSamplesReady(stats); },
      conditions: function (stats) {
        return kd(stats.secondHalf) >= kd(stats.firstHalf) + 0.5;
      },
      title: 'Strong Mid-Match Adjustment',
      message: function () {
        return 'Eliminations versus deaths improved after the side switch compared with the first half of this match.';
      },
      evidence: function (stats) {
        return 'Scoreboard snapshot: first half ' + stats.firstHalf.kills + '/' + stats.firstHalf.deaths +
          ', second half ' + stats.secondHalf.kills + '/' + stats.secondHalf.deaths + '.';
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
      title: 'Second Half KD Dropped',
      message: function () {
        return 'Eliminations versus deaths were weaker after the side switch than they were in the first half.';
      },
      evidence: function (stats) {
        return 'Scoreboard snapshot: first half ' + stats.firstHalf.kills + '/' + stats.firstHalf.deaths +
          ', second half ' + stats.secondHalf.kills + '/' + stats.secondHalf.deaths + '.';
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
        return 'Most eliminations tied to your name in the kill feed used a pistol. Review how the later gun rounds compared with those opening duels.';
      },
      evidence: function (stats) {
        return 'kill_feed: ' + stats.pistolElims + ' pistol eliminations out of ' + stats.weaponElims + ' recorded for you.';
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
        return 'Most eliminations tied to your name in the kill feed used ' + stats.topWeapon + '.';
      },
      evidence: function (stats) {
        return 'kill_feed: ' + stats.topWeaponCount + ' of ' + stats.weaponElims + ' eliminations with ' + stats.topWeapon + '.';
      }
    },
    {
      id: 'fewer-isolated-fights',
      category: 'Survivability',
      group: 'isolated-fights',
      priority: 70,
      enabled: false,
      minimumData: function () { return false; },
      conditions: function () { return false; },
      title: 'Take Fewer Isolated Fights',
      message: function () { return ''; },
      evidence: function () { return 'Disabled: kill_feed names a killer and a victim, not whether a teammate was nearby.'; }
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
      firstHalf: null,
      killInteractions: {},
      localWeaponElims: {},
      postgameGenerated: false,
      matchEnded: false,
      recommendations: []
    };
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
    if (!raw) return null;
    return AGENT_NAMES[raw] || raw;
  }

  function agentIcon(name) {
    if (!name) return '';
    var file = name === 'KAY/O' ? 'KAYO' : name;
    return 'Agent_Icons/' + file + '_icon.webp';
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

  function mapLabel() {
    if (state.map == null || state.map === '') return 'Map pending';
    return String(state.map);
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

  function snapshotRound() {
    if (state.roundPhase !== 'end' || state.roundNumber == null || !state.roundReport) return;
    state.roundsByNumber[state.roundNumber] = state.roundReport;
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
      var hitCount = asNumber(report.hit);
      var nonLethal = asNumber(report.headshot);
      var lethal = asNumber(report.final_headshot);
      if (hitCount != null && (nonLethal != null || lethal != null)) {
        addReportNumber(totals, 'hits', hitCount);
        addReportNumber(totals, 'headshots', (nonLethal == null ? 0 : nonLethal) + (lethal == null ? 0 : lethal));
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
      firstHalf: state.firstHalf,
      secondHalf: secondHalf,
      weaponElims: weapons.weaponElims,
      pistolElims: weapons.pistolElims,
      topWeapon: weapons.topWeapon,
      topWeaponCount: weapons.topWeaponCount
    };
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
      if (picked.length >= 3 || usedGroups[rule.group]) return;
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
    state.recommendations = evaluateRules(buildPostMatchStats());
    state.postgameGenerated = true;
  }

  function applyInfoPayload(payload) {
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
    render();
  }

  function onGameEvent(gameEvent) {
    if (!gameEvent || !gameEvent.name) return;
    if (gameEvent.name === 'match_start') {
      resetMatch(null);
      if (overwolf.games.events.getInfo) {
        overwolf.games.events.getInfo(function (result) {
          if (result && result.success) applyInfoPayload(result);
        });
      }
      return;
    }
    if (gameEvent.name === 'kill_feed') noteKillFeed(parseMaybeJson(gameEvent.data));
    if (gameEvent.name === 'match_end') state.matchEnded = true;
    maybeGenerateRecommendations();
    render();
  }

  function render() {
    renderStats();
    renderScoreboard();
    renderRecommendations();
  }

  function renderStats() {
    var view = document.getElementById('statsView');
    var local = localPlayer();
    var agent = (local && local.agent) || state.local.agent;
    var name = (local && local.name) || state.local.name;
    var kills = local && local.kills != null ? local.kills : state.killTotals.kills;
    var deaths = local && local.deaths != null ? local.deaths : state.deathTotal;
    var assists = local && local.assists != null ? local.assists : state.killTotals.assists;
    var weapon = local && showLoadout(local) ? weaponName(local.weapon) : null;
    var shield = local && showEconomy(local) ? shieldName(local.shield) : null;
    var ult = local && local.ultPoints != null ? (local.ultPoints + ' / ' + dash(local.ultMax)) : null;
    var cells = [
      ['Health', state.local.health],
      ['Kills', kills],
      ['Deaths', deaths],
      ['Assists', assists],
      ['Credits', local && showEconomy(local) ? local.credits : null],
      ['Weapon', weapon],
      ['Shield', shield],
      ['Ultimate', ult],
      ['Side', sideForPlayer(local || { isLocal: true })]
    ];
    view.innerHTML =
      '<div class="stat-hero">' +
        (agent ? '<img class="agent-portrait" src="' + escapeHtml(agentIcon(agent)) + '" alt="">' : '<div class="agent-portrait"></div>') +
        '<div><div class="hero-name">' + escapeHtml(dash(agent)) + '</div><div class="hero-side">' + escapeHtml(dash(name)) + '</div></div>' +
      '</div>' +
      '<div class="stat-grid">' + cells.map(function (cell) {
        return '<div class="stat-cell"><div class="stat-label">' + escapeHtml(cell[0]) + '</div><div class="stat-value">' + escapeHtml(dash(cell[1])) + '</div></div>';
      }).join('') + '</div>' +
      '<div class="ability-row">' + abilityHtml(agent, state.local.abilities) + '</div>';
  }

  function abilityHtml(agent, abilities) {
    var manifest = window.AGENT_ABILITY_MANIFEST && agent && window.AGENT_ABILITY_MANIFEST[agent];
    if (!manifest) return '<div class="empty">Ability icons appear when your agent is known.</div>';
    return manifest.filter(function (ability) {
      return ability.label === 'C' || ability.label === 'Q' || ability.label === 'E' || ability.label === 'X';
    }).map(function (ability) {
      var ready = abilities && abilities[ability.label] === true;
      var unknown = !abilities || abilities[ability.label] == null;
      return '<div class="ability' + (ready ? ' ready' : '') + '" title="' + escapeHtml(ability.label) + '">' +
        '<img src="' + escapeHtml(ability.src) + '" alt="' + escapeHtml(ability.label) + '">' +
        '<span>' + escapeHtml(unknown ? ability.label : (ready ? ability.label : ability.label)) + '</span></div>';
    }).join('');
  }

  function scoreText() {
    var score = state.matchScore;
    if (!score) return { left: EMPTY, right: EMPTY };
    if (score.won != null || score.lost != null) return { left: dash(score.won), right: dash(score.lost) };
    if (score.team_0 != null || score.team_1 != null) return { left: dash(score.team_0), right: dash(score.team_1) };
    return { left: EMPTY, right: EMPTY };
  }

  function teamHtml(title, side, players, className) {
    var rows = players.map(function (player) {
      var alive = player.alive === false ? ' dead' : '';
      var subtext = playerSubtext(player);
      return '<div class="player-row' + alive + '" data-player-id="' + escapeHtml(player.id) + '">' +
        '<img src="' + escapeHtml(agentIcon(player.agent)) + '" alt="">' +
        '<div class="player-main"><div class="player-name">' + escapeHtml(dash(player.name)) + '</div>' +
        '<div class="player-meta">' + escapeHtml(subtext || EMPTY) + '</div></div>' +
        '<div class="player-kda">' + escapeHtml(dash(player.kills)) + '/' + escapeHtml(dash(player.deaths)) + '/' + escapeHtml(dash(player.assists)) + '</div></div>';
    }).join('');
    return '<div class="team ' + className + '"><div class="team-header">' + escapeHtml(title) + '</div>' +
      '<div class="team-side">' + escapeHtml(side || EMPTY) + '</div>' +
      (rows || '<div class="empty">Waiting for roster.</div>') + '</div>';
  }

  function renderScoreboard() {
    var view = document.getElementById('scoreboardView');
    var players = playerList();
    var allies = players.filter(function (player) { return player.teammate !== false; });
    var enemies = players.filter(function (player) { return player.teammate === false; });
    var score = scoreText();
    var allySide = sideForPlayer({ isLocal: true });
    var enemySide = allySide === 'Attack' ? 'Defense' : (allySide === 'Defense' ? 'Attack' : EMPTY);
    var detail = '';
    if (selectedPlayerId && state.players[selectedPlayerId]) detail = detailHtml(state.players[selectedPlayerId]);
    view.innerHTML =
      '<div class="score-container"><div class="score-side blue"><div class="score-number">' + escapeHtml(score.left) + '</div><div class="score-label">Team</div></div>' +
      '<div class="score-divider">:</div><div class="score-side red"><div class="score-number">' + escapeHtml(score.right) + '</div><div class="score-label">Team</div></div></div>' +
      '<div class="page-note">' + escapeHtml(mapLabel()) + '</div>' +
      '<div class="teams">' + teamHtml('Your team', allySide, allies, 'allies') + teamHtml('Opponents', enemySide, enemies, 'enemies') + '</div>' +
      detail;
    view.querySelectorAll('.player-row').forEach(function (row) {
      row.addEventListener('click', function () {
        selectedPlayerId = row.getAttribute('data-player-id');
        renderScoreboard();
      });
    });
    var back = document.getElementById('detailBack');
    if (back) back.addEventListener('click', function () { selectedPlayerId = null; renderScoreboard(); });
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
    return '<div class="detail"><button class="back-btn" id="detailBack" type="button">Back</button>' +
      '<h2>' + escapeHtml(dash(player.name)) + ' · ' + escapeHtml(dash(player.agent)) + '</h2>' +
      '<div class="player-meta">Kills ' + escapeHtml(dash(player.kills)) + SUBTEXT_SEP + 'Deaths ' + escapeHtml(dash(player.deaths)) + SUBTEXT_SEP + 'Assists ' + escapeHtml(dash(player.assists)) + '</div>' +
      '<div class="duel-list"><h3>Eliminations this match</h3>' + (kills.length ? kills.map(escapeHtml).join('<br>') : 'No kill-feed eliminations recorded yet.') +
      '<h3>Deaths this match</h3>' + (deaths.length ? deaths.map(escapeHtml).join('<br>') : 'No kill-feed deaths recorded yet.') + '</div></div>';
  }

  function renderRecommendations() {
    var view = document.getElementById('recommendationsView');
    if (!state.postgameGenerated) {
      view.innerHTML = '<div class="empty">Match analysis will be available after this game.</div>';
      return;
    }
    if (!state.recommendations.length) {
      view.innerHTML = '<div class="page-note">Post-match</div><div class="empty">No recommendation had enough recorded data from this match.</div>';
      return;
    }
    view.innerHTML = '<div class="page-note">Post-match</div>' + state.recommendations.map(function (rule) {
      return '<article class="rec-card"><div class="rec-category">' + escapeHtml(rule.category) + '</div>' +
        '<div class="rec-title">' + escapeHtml(rule.title) + '</div>' +
        '<div class="rec-text">' + escapeHtml(rule.message) + '</div>' +
        '<div class="rec-evidence">' + escapeHtml(rule.evidence) + '</div></article>';
    }).join('');
  }

  document.querySelectorAll('.nav-tab').forEach(function (button) {
    button.addEventListener('click', function () {
      document.querySelectorAll('.nav-tab').forEach(function (tab) { tab.classList.remove('active'); });
      document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
      button.classList.add('active');
      document.getElementById('page-' + button.getAttribute('data-page')).classList.add('active');
    });
  });

  function formatInline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function renderBotHtml(text) {
    return escapeHtml(text).split('\n').filter(function (line) { return line.trim(); }).map(function (line) {
      return '<p>' + formatInline(line.trim()) + '</p>';
    }).join('');
  }

  function addChatMessage(text, isUser) {
    var log = document.getElementById('chatLog');
    var message = document.createElement('div');
    message.className = 'chat-msg ' + (isUser ? 'user' : 'bot');
    if (isUser) message.textContent = text;
    else message.innerHTML = renderBotHtml(text);
    log.appendChild(message);
    log.scrollTop = log.scrollHeight;
  }

  function getSpikeCoachIdToken() {
    var auth = window.firebaseAuth;
    if (!auth) return Promise.resolve(null);
    if (auth.currentUser && auth.currentUser.getIdToken) {
      return auth.currentUser.getIdToken().catch(function () { return null; });
    }
    if (!window.onAuthStateChanged) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var unsubscribe = window.onAuthStateChanged(function (user) {
        if (typeof unsubscribe === 'function') unsubscribe();
        if (!user || !user.getIdToken) {
          resolve(null);
          return;
        }
        user.getIdToken().then(resolve).catch(function () { resolve(null); });
      });
    });
  }

  document.getElementById('chatForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var input = document.getElementById('chatInput');
    var message = input.value.trim();
    if (!message) return;
    if (message.length > 250) {
      addChatMessage('Please keep messages to 250 characters or fewer.', false);
      return;
    }
    addChatMessage(message, true);
    input.value = '';
    var chatUrl = 'http://127.0.0.1:3000/api/chat';
    getSpikeCoachIdToken().then(function (token) {
      var headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = 'Bearer ' + token;
      console.log('[SpikeCoach Chat] POST', chatUrl, 'authorization:', !!token);
      return fetch(chatUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: message })
      });
    }).then(function (response) {
      console.log('[SpikeCoach Chat] status', response.status);
      return response.json();
    }).then(function (data) {
      addChatMessage(data.response || data.error || 'Error getting response.', false);
    }).catch(function (error) {
      console.log('[SpikeCoach Chat] request failed', error && error.name ? error.name : 'Error');
      addChatMessage('Cannot connect to server. Run: npm run start-server', false);
    });
  });

  function startGep() {
    if (!window.overwolf || !overwolf.games || !overwolf.games.events) return;
    overwolf.games.events.onInfoUpdates2.addListener(applyInfoPayload);
    overwolf.games.events.onNewEvents.addListener(function (payload) {
      ((payload && payload.events) || []).forEach(onGameEvent);
    });
    overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, function () {
      overwolf.games.events.getInfo(function (result) {
        if (result && result.success) applyInfoPayload(result);
      });
    });
  }

  render();
  startGep();
})();
