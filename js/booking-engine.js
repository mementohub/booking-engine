(function($) {
	'use strict';
	
	$.fn.extend({
		imementoBookingEngine: function (options) {
			
			//defaults
			let o = $.extend({
				hid: null,
				theme: 'default',
				min_height: '300px',
				email: null,
				token: null,
				adults: 2,
				children: 0,
				arrival: '2018-11-28',
				departure: '2018-11-30',
				currency: 'RON',
			}, options);
			
			//declare vars
			let $elem = $(this), $elem_inner,
				$rooms, $book, $confirmation, $search,
				jwt, statics, rooms,
				endpoints = {
					auth: 'http://auth.test/api/v1/authenticate',
					bookings: 'https://bookings.services.dev.imementohub.com/api', //'http://booking.test/api'
				};
			
			//toggles the loading status
			function loading(status) {
				$elem.toggleClass('loading', status);
			}
			
			function showError(msg) {
				alert(msg);
			}
			
			//auth the hotel
			function auth() {
				return $.ajax({
					method: 'POST',
					headers: {
						Accept: 'application/json',
					},
					url: endpoints.auth,
					data: {
						email: o.email,
						password: o.token,
					},
				})
				.fail(function (error) {
					console.log(error);
				})
				.done(function (response) {
					jwt = response;
				})
			}
			
			//get the static info: images and stuff
			function getStatic() {
				return $.ajax({
					method: 'GET',
					dataType: 'json',
					url: endpoints.bookings + `/statics/hotels/${o.hid}`,
					headers: {
						Authorization: 'Bearer ' + jwt,
					},
				})
				.fail(function (error) {
					console.log(error);
				})
				.done(function (response) {
					console.log(response);
					statics = response;
				})
			}
			
			//get and show the rooms
			function getRooms() {
				return $.ajax({
					method: 'GET',
					dataType: 'json',
					url: endpoints.bookings + `/search/hotels/1?start=${o.arrival}&stop=${o.departure}&currency=${o.currency}`,
					headers: {
						Authorization: 'Bearer ' + jwt,
					},
				})
				.fail(function (error) {
					console.log(error);
				})
				.done(function (response) {
					console.log(response);
					rooms = response;
				})
			}
			
			function showSearch() {
				$search = `
<div class="imemento-search">
	<form class="pure-form pure-form-stacked">
		<div class="pure-g">
            <div class="pure-u-1 pure-u-md-6-24">
                <label>Sosire</label>
                <input class="pure-u-1" type="text" value="${o.arrival}" name="arrival" required>
            </div>
            <div class="pure-u-1 pure-u-md-6-24">
                <label>Plecare</label>
                <input class="pure-u-1" type="text" value="${o.departure}" name="departure" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
                <label>Adulti</label>
                <input class="pure-u-1" type="text" value="${o.adults}" name="adults" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
                <label>Copii</label>
                <input class="pure-u-1" type="text" value="${o.children}" name="children" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
				<button type="submit" class="pure-button pure-button-primary imemento-block">Cauta</button>
            </div>
        </div>
	</form>
</div>
				`;
				
				$elem.prepend($search);
			}
			
			function showRooms() {
				
				if (! rooms.all_rooms) {
					showError('Nu sunt camere disponibile.');
					return;
				}
				
				$rooms = $('<div class="imemento-rooms"></div>');
				
				//create each room
				rooms.all_rooms.forEach(function (room) {
					let room_statics = statics.rooms.filter(function(sroom) {
						return sroom.id === room.room_id;
					});
					
					let img_src; //todo placeholder
					if (room_statics.length > 0)
						img_src = room_statics[0].media[0].url.medium;
					
					let $room = $(`
<div class="imemento-room pure-g">
	<div class="imemento-room-image pure-u-1 pure-u-sm-3-24">
		<img src="${img_src}" alt="" class="pure-img" />
	</div>
	<div class="imemento-room-text pure-u-1 pure-u-sm-21-24">
		<h3 class="imemento-h3">${room.room_name}</h3>
		<p class="imemento-p">Tip camera, numar disponibile, facilitati, etc.</p>
	</div>
	<div class="imemento-rates pure-u-1"></div>
</div>
					`);
					
					//create each rate
					room.all_prices.forEach(function (rate) {
						let $rate = $(`
<div class="imemento-rate">
	${rate.rate_plan_name}
	<button type="submit" class="pure-button pure-button-success">Rezerva</button>
</div>
						`);
						$room.children('.imemento-rates').append($rate);
					});
					
					$rooms.append($room);
				});
				
				$elem_inner.html($rooms);
				loading(false);
			}
			
			//auth & get the rooms
			function init() {
				$elem_inner = $('<div class="imemento-wrapper"></div>')
				
				$elem
					.addClass(`imemento-booking im-theme-${o.theme} loading`)
					.css({minHeight: o.min_height})
					.append($elem_inner);
				
				showSearch();
				
				//chain ajax calls
				auth()
					.then(getStatic)
					.then(getRooms)
					.then(showRooms);
			}
			
			init();
			
			// maintain chainability
			return this;
		}
	});
	
}(jQuery));