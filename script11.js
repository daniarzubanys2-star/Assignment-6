/* Assignment #6 – jQuery: The Party in Motion (Task 1 + Task 2)
   Only jQuery is used for behavior. No inline onclick, no CSS transitions/animations. */
$(function () {
  'use strict';

  /* =====================================================
     1. DATA – the party as an array (rooms -> guests, left to right)
     ===================================================== */
  var PARTY = [
    { id: 'balcony', name: 'Balcony', floor: 2, guests: [
      { name: 'Aigerim', color: 'blue',   time: '20:45', aitu: false, items: ['bag', 'cup'] },
      { name: 'Aliya',   color: 'yellow', time: '21:15', aitu: false, items: ['phone', 'bag'] },
      { name: 'Madina',  color: 'green',  time: '22:10', aitu: false, items: ['phone', 'bag', 'cup'] },
      { name: 'Ivan',    color: 'blue',   time: '20:10', aitu: true,  items: ['bag'] }
    ]},
    { id: 'hall', name: 'Hall', floor: 2, guests: [
      { name: 'Arman',   color: 'yellow', time: '20:35', aitu: false, items: ['bag', 'cup'] },
      { name: 'Sophia',  color: 'purple', time: '21:20', aitu: true,  items: ['phone'] },
      { name: 'Dias',    color: 'green',  time: '19:45', aitu: true,  items: [] },
      { name: 'Bekzat',  color: 'purple', time: '20:55', aitu: true,  items: ['bag', 'cup', 'crumbs'] },
      { name: 'Aruzhan', color: 'blue',   time: '21:50', aitu: true,  items: ['phone'] },
      { name: 'Saule',   color: 'green',  time: '21:25', aitu: false, items: ['glasses'] }
    ]},
    { id: 'kitchen', name: 'Kitchen', floor: 1, guests: [
      { name: 'Nurlan',  color: 'red',    time: '19:40', aitu: true,  items: ['bag'] },
      { name: 'Emma',    color: 'black',  time: '20:15', aitu: true,  items: ['phone', 'bag'] },
      { name: 'Timur',   color: 'green',  time: '21:05', aitu: true,  items: ['phone', 'bag', 'cup'] },
      { name: 'Sergey',  color: 'yellow', time: '20:50', aitu: true,  items: [] },
      { name: 'Yerlan',  color: 'red',    time: '21:40', aitu: true,  items: ['glasses', 'phone'] },
      { name: 'Kamila',  color: 'black',  time: '20:05', aitu: false, items: ['bag'] }
    ]},
    { id: 'living', name: 'Living room', floor: 1, guests: [
      { name: 'Daniel',  color: 'blue',   time: '19:55', aitu: true,  items: ['glasses'] },
      // NOTE: Zarina is the thief, so she must have crumbs and NO cup, arriving 21:10 (see the picture).
      { name: 'Zarina',  color: 'green',  time: '21:10', aitu: false, items: ['bag', 'crumbs'] },
      { name: 'Natasha', color: 'yellow', time: '20:30', aitu: true,  items: ['phone', 'bag'] },
      { name: 'Askar',   color: 'black',  time: '21:00', aitu: true,  items: ['bag'] },
      { name: 'Inkar',   color: 'purple', time: '20:20', aitu: false, items: ['bag'] }
    ]}
  ];
  var ORIGINAL = JSON.parse(JSON.stringify(PARTY));   // used by "Reset party"
  var MIRAS = { name: 'Miras', color: 'blue', time: '21:20', aitu: true, items: ['phone'] };

  var ICONS = { phone: '📱', glasses: '👓', bag: '🎒', cup: '☕', crumbs: '🍰' };
  var WORDS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };

  var orderCounter = 100;   // gives a moved guest an "order" larger than everybody else
  var $modal = null;        // the one open guest card (or null)
  var $owner = null;        // the guest card the modal belongs to

  /* ---------- small helpers ---------- */
  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function mins(el) { return parseInt($(el).attr('data-minutes'), 10); }   // arrival time in minutes
  function ord(el)  { return parseFloat($(el).attr('data-order')); }       // position in the picture order
  function roomById(id) { return PARTY.filter(function (r) { return r.id === id; })[0]; }

  /* =====================================================
     2. BUILD THE PAGE FROM THE ARRAY
     ===================================================== */
  // Guest data lives on the card: classes (c-blue, aitu, has-bag...) and data-* attributes.
  function buildCard(g, order) {
    var $c = $('<div class="guest"></div>')
      .addClass('c-' + g.color)
      .toggleClass('aitu', g.aitu)
      .attr({
        'data-name': g.name, 'data-time': g.time, 'data-minutes': toMin(g.time),
        'data-color': g.color, 'data-aitu': g.aitu ? 'yes' : 'no',
        'data-items': g.items.join(' '), 'data-order': order
      });
    var icons = '';
    g.items.forEach(function (it) { $c.addClass('has-' + it); icons += ICONS[it]; });
    $c.append(
      $('<img class="avatar">').attr({ src: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + g.name, alt: g.name }),
      g.aitu ? $('<span class="badge" title="AITU student">🎓</span>') : '',
      $('<div class="name"></div>').text(g.name),
      $('<div class="time"></div>').text('🕒 ' + g.time),
      $('<div class="icons"></div>').text(icons)
    );
    return $c;
  }

  function buildParty() {
    closeModalNow();
    $('.fly').stop(true).remove();           // flying clones from unfinished moves
    $('#house, #house *').stop(true);        // stop everything that is still animating
    var $house = $('#house').empty();
    [2, 1].forEach(function (floor) {
      var $floor = $('<section class="floor"></section>').attr('data-floor', floor)
        .append($('<div class="floor-label"></div>').text('Floor ' + floor));
      var $rooms = $('<div class="rooms"></div>').appendTo($floor);
      PARTY.filter(function (r) { return r.floor === floor; }).forEach(function (room) {
        var $room = $('<div class="room"></div>').attr({ 'data-room': room.id, 'data-floor': floor });
        $room.append($('<div class="room-head"></div>').append(
          $('<h3></h3>').text(room.name),
          $('<button class="sort-btn" type="button">Sort by time</button>')
        ));
        var $guests = $('<div class="guests"></div>').appendTo($room);
        room.guests.forEach(function (g, i) { $guests.append(buildCard(g, i)); });
        $rooms.append($room);
      });
      $house.append($floor);
    });
  }

  /* =====================================================
     3. THE 20 CASES – each run() is ONE jQuery chain that searches the page
     ===================================================== */
  var CASES = [
    { q: 'Who is in the hall?', run: function () {
      return $('.room[data-room="hall"] .guest'); } },
    { q: 'Who is dressed in yellow or purple?', run: function () {
      return $('.guest.c-yellow, .guest.c-purple'); } },
    { q: 'Which AITU students are upstairs?', run: function () {
      return $('.floor[data-floor="2"] .guest.aitu'); } },
    { q: 'Who has glasses or a bag?', run: function () {
      return $('.guest.has-glasses, .guest.has-bag'); } },
    { q: 'Who came with nothing at all?', run: function () {
      return $('.guest:not([class*="has-"])'); } },
    { q: 'Who has a phone but no bag?', run: function () {
      return $('.guest.has-phone:not(.has-bag)'); } },
    { q: 'Who arrived between 20:30 and 21:00 (inclusive)?', run: function () {
      return $('.guest').filter(function () { return mins(this) >= 1230 && mins(this) <= 1260; }); } },
    { q: 'Who arrived after 21:00 and is not an AITU student?', run: function () {
      return $('.guest:not(.aitu)').filter(function () { return mins(this) > 1260; }); } },
    { q: 'Who stands right next to Askar?', run: function () {
      // left neighbour + right neighbour (adjacent-sibling selector)
      return $('.guest[data-name="Askar"]').prev('.guest').add('.guest[data-name="Askar"] + .guest'); } },
    { q: 'Who stands last in each room?', run: function () {
      return $('.guest:last-child'); } },
    { q: 'Who stands third in each room?', run: function () {
      return $('.guest:nth-child(3)'); } },
    { q: 'Who stands after Timur in his room?', run: function () {
      return $('.guest[data-name="Timur"]').nextAll('.guest'); } },
    { q: 'Who stands right before someone in black?', run: function () {
      return $('.guest.c-black').prev('.guest'); } },
    { q: 'In which room is Aruzhan?', run: function () {
      return $('.guest[data-name="Aruzhan"]').closest('.room'); } },
    { q: 'Which rooms have fewer than 6 guests?', run: function () {
      return $('.room:not(:has(.guest:nth-child(6)))'); } },
    { q: 'In which rooms does somebody have a cup, but nobody wears glasses?', run: function () {
      return $('.room:has(.guest.has-cup):not(:has(.guest.has-glasses))'); } },
    { q: 'Who came first to each room?', run: function () {
      // a guest with no sibling who arrived earlier
      return $('.guest').filter(function () {
        var m = mins(this);
        return $(this).siblings('.guest').filter(function () { return mins(this) < m; }).length === 0;
      }); } },
    { q: 'Miras (AITU, blue, 21:20, phone) joins between Askar and Inkar.', run: function () {
      return buildCard(MIRAS, 3.5).addClass('new').hide()
        .insertAfter('.guest[data-name="Askar"]').fadeIn(700); } },
    { q: 'Natasha says goodbye and leaves.', noSpotlight: true, run: function () {
      return $('.guest[data-name="Natasha"]').addClass('leaving')
        .fadeOut(700, function () { $(this).remove(); }); } },
    { q: 'Who took the cake?', run: function () {
      // downstairs, crumbs, no cup, arrived 21:00 < t < 21:30, next to an AITU student
      return $('.floor[data-floor="1"] .guest.has-crumbs:not(.has-cup)')
        .filter(function () { return mins(this) > 1260 && mins(this) < 1290; })
        .filter(function () { return $(this).prev('.aitu').add($(this).next('.aitu')).length > 0; }); } }
  ];

  // Create the 20 buttons
  $.each(CASES, function (i, c) {
    $('<button type="button" class="case-btn"></button>')
      .attr({ 'data-case': i, title: c.q }).text('Case ' + (i + 1)).appendTo('#cases');
  });

  function runCase(i) {
    var c = CASES[i];
    buildParty();                         // 1. rebuild the page
    var $found = c.run();                 // 2. the ONE jQuery chain
    $found.addClass('hit');               // 3. highlight
    var names = $found.map(function () {
      return $(this).is('.room') ? $(this).find('h3').text() : $(this).attr('data-name');
    }).get();
    $('#result').html('<b>Case ' + (i + 1) + ': ' + c.q + '</b><br>Found: ' + $found.length +
      (names.length ? ' – ' + names.join(', ') : ' – nobody'));
    if (!c.noSpotlight) { spotlight($found); }
    // jump once
    $found.filter('.guest').not('.leaving').animate({ top: -18 }, 150).animate({ top: 0 }, 150);
    $found.filter('.room').animate({ top: -8 }, 150).animate({ top: 0 }, 150);
  }

  /* =====================================================
     4. TASK 2 – SPOTLIGHT
     ===================================================== */
  function spotlight($found) {
    // Cases that find rooms keep all guests of those rooms bright
    var $keep = $found.filter('.room').find('.guest').add($found.filter('.guest'));
    $('.guest').not($keep).stop(true, true).fadeTo(300, 0.2);
    $keep.not('.new').stop(true, true).fadeTo(300, 1);   // Miras is still fading in
  }

  $('#cases').on('click', '.case-btn', function () { runCase(parseInt($(this).attr('data-case'), 10)); });

  $('#clear-btn').on('click', function () {
    $('.guest').stop(true, true).fadeTo(300, 1).removeClass('hit');
    $('.room').removeClass('hit');
  });

  $('#reset-btn').on('click', function () {
    PARTY = JSON.parse(JSON.stringify(ORIGINAL));
    buildParty();
    $('#result').text('Party reset to the picture.');
  });

  /* =====================================================
     5. TASK 2 – GUEST CARD (modal grows out of the avatar)
     ===================================================== */
  function avatarRect($g) {
    var $a = $g.find('.avatar'), o = $a.offset();
    return { left: o.left - $(window).scrollLeft(), top: o.top - $(window).scrollTop(),
             w: $a.outerWidth(), h: $a.outerHeight() };
  }

  function describe($g) {
    var items = ($g.attr('data-items') || '').split(' ').filter(Boolean).map(function (k) { return WORDS[k]; });
    var has = 'Came with nothing';
    if (items.length) {
      has = 'Has ' + (items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items.slice(-1) : items[0]);
    }
    var $room = $g.closest('.room');
    return [
      'Came at ' + $g.attr('data-time'),
      $g.is('.aitu') ? 'AITU student' : 'Not an AITU student',
      'Wears ' + $g.attr('data-color') + ' clothing',
      has,
      'Now in the ' + $room.find('h3').text().toLowerCase() + ' (floor ' + $room.attr('data-floor') + ')'
    ];
  }

  function openModal($g) {
    if ($modal) {                                   // only one card open: close it, then open the new one
      closeModal(function () { openModal($g); });
      return;
    }
    if (!$g.closest('body').length) { return; }
    var name = $g.attr('data-name'), here = $g.closest('.room').attr('data-room');
    var $inner = $('<div class="modal-inner"></div>').addClass('c-' + $g.attr('data-color'))
      .append($('<img>').attr('src', $g.find('.avatar').attr('src')), $('<h2></h2>').text(name));
    var $ul = $('<ul></ul>').appendTo($inner);
    $.each(describe($g), function (_, t) { $ul.append($('<li></li>').text(t)); });
    $.each(PARTY, function (_, room) {              // one "Move to ..." button for every other room
      if (room.id !== here) {
        $inner.append($('<button type="button" class="move-btn"></button>')
          .attr({ 'data-name': name, 'data-to': room.id }).text('Move to the ' + room.name.toLowerCase()));
      }
    });
    var $m = $('<div class="modal"></div>').append($inner).appendTo('body');

    // measure the final size, then shrink to the avatar
    var W = 300;
    $m.css({ left: -9999, top: 0, width: W, height: 'auto' });
    var H = $m.outerHeight();
    var r = avatarRect($g);
    $m.css({ left: r.left, top: r.top, width: r.w, height: r.h, opacity: 0.5 });
    $inner.hide();
    $modal = $m; $owner = $g;

    $m.animate({
      left: Math.max(8, ($(window).width() - W) / 2),
      top: Math.max(8, ($(window).height() - H) / 2),
      width: W, height: H, opacity: 1
    }, 350, function () { $inner.fadeIn(150); });
  }

  function closeModal(done) {
    if (!$modal) { if (done) { done(); } return; }
    var $m = $modal, $g = $owner;
    $modal = null; $owner = null;                   // closed from now on (fast clicks are safe)
    $m.stop(true, true);                            // finish the opening animation
    $m.find('.modal-inner').stop(true, true).hide();
    var target = ($g && $g.closest('body').length)
      ? avatarRect($g)
      : { left: $m.position().left + 150, top: $m.position().top + 50, w: 10, h: 10 };
    $m.animate({ left: target.left, top: target.top, width: target.w, height: target.h, opacity: 0 }, 250,
      function () { $m.remove(); if (done) { done(); } });
  }

  function closeModalNow() {                        // used when the page is rebuilt
    if ($modal) { $modal.stop(true, true).remove(); }
    $('.modal').remove();
    $modal = null; $owner = null;
  }

  // Click a guest (stopPropagation so the "outside click" handler does not close it at once)
  $('#house').on('click', '.guest', function (e) { e.stopPropagation(); openModal($(this)); });
  $(document).on('click', function (e) { if ($modal && !$(e.target).closest('.modal').length) { closeModal(); } });
  $(document).on('keydown', function (e) { if (e.key === 'Escape') { closeModal(); } });

  /* =====================================================
     6. TASK 2 – MOVE A GUEST (the card flies to the new room)
     ===================================================== */
  // Finish running move animations of a room so measuring positions is safe
  function finishMoves($room) {
    $room.find('.gap').each(function () {
      var $fly = $(this).data('fly');
      if ($fly) { $fly.stop(true, true); }
      $(this).stop(true, true);
    });
  }

  function moveGuest($card, toId) {
    var fromId = $card.closest('.room').attr('data-room');
    if (!fromId || fromId === toId || $card.data('moving')) { return; }   // fast-click guard
    $card.data('moving', true);

    // 1) update the array, so the cases of Task 1 find the guest in the new room
    var name = $card.attr('data-name'), from = roomById(fromId), to = roomById(toId);
    var idx = -1;
    $.each(from.guests, function (i, g) { if (g.name === name) { idx = i; } });
    if (idx > -1) { to.guests.push(from.guests.splice(idx, 1)[0]); }
    $card.attr('data-order', orderCounter++);       // goes to the end of the new room

    // 2) measure, make a flying clone, leave a collapsing gap in the old room
    var $dest = $('.room[data-room="' + toId + '"] .guests');
    var w = $card.outerWidth(), h = $card.outerHeight();
    var start = $card.offset();
    var $fly = $card.clone().removeClass('guest hit').addClass('fly')
      .css({ left: start.left, top: start.top, width: w, margin: 0 }).appendTo('body');
    var $ghost = $('<div class="gap"></div>').css({ width: w, height: h, margin: '0 3px' }).insertBefore($card);
    $card.detach();

    // 3) in the new room a slot opens slowly at the end; find where it will end up
    var $slot = $('<div class="gap"></div>').css({ width: w, height: h, margin: '0 3px' }).appendTo($dest);
    var target = $slot.offset();
    $slot.css({ width: 0, marginLeft: 0, marginRight: 0 }).data('fly', $fly);

    var T = 700;
    var pGhost = $ghost.animate({ width: 0, marginLeft: 0, marginRight: 0 }, T, function () { $ghost.remove(); }).promise();
    var pSlot = $slot.animate({ width: w, marginLeft: 3, marginRight: 3 }, T).promise();
    var pFly = $fly.animate({ left: target.left, top: target.top }, T).promise();

    // 4) when everything has finished, the real card takes the slot
    $.when(pGhost, pSlot, pFly).done(function () {
      $slot.replaceWith($card.css({ top: 0, left: 0 }));
      $fly.remove();
      $card.removeData('moving');
    });
  }

  $(document).on('click', '.move-btn', function () {
    var name = $(this).attr('data-name'), to = $(this).attr('data-to');
    closeModal(function () { moveGuest($('.guest[data-name="' + name + '"]'), to); });
  });

  /* =====================================================
     7. TASK 2 – SORT BY TIME (cards slide to new places)
     ===================================================== */
  // FLIP: remember positions, re-order the DOM, then slide each card from its old place to the new one.
  function reorder($room, sortedEls) {
    var $cards = $room.find('.guests .guest').stop(true, true);
    var before = {};
    $cards.each(function () { before[$(this).attr('data-name')] = $(this).offset(); });
    $.each(sortedEls, function (_, el) { $room.find('.guests').append(el); });
    $cards.each(function () {
      var $c = $(this), a = before[$c.attr('data-name')], b = $c.offset();
      $c.css({ left: a.left - b.left, top: a.top - b.top }).animate({ left: 0, top: 0 }, 600);
    });
  }

  $(document).on('click', '.sort-btn', function () {
    var $btn = $(this), $room = $btn.closest('.room');
    var on = !$btn.hasClass('on');                  // the state flips immediately, so fast clicks stay consistent
    $btn.toggleClass('on', on).text(on ? 'Original order' : 'Sort by time');
    finishMoves($room);
    var sorted = $room.find('.guests .guest').get().sort(function (a, b) {
      return on ? (mins(a) - mins(b) || ord(a) - ord(b)) : ord(a) - ord(b);
    });
    reorder($room, sorted);
  });

  /* ---------- start ---------- */
  buildParty();
});
