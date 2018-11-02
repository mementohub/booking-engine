(function($) {
	'use strict';
	
	//declare vars
	let $elem, $elem_inner,
		$rooms, $booking, $confirm, $search,
		o, data, jwt, statics, rooms,
		endpoints = {
			auth: 'https://auth.staging.imementohub.com/api/v1/authenticate',
			bookings: 'https://bookings.services.staging.imementohub.com/api', //'http://booking.test/api'
		};
	
	$.fn.extend({
		imementoBooking: function (options) {
			$elem = $(this);
			
			//defaults
			o = $.extend({
				hid: null,
				theme: 'default',
				min_height: '300px',
				email: null,
				token: null,
				adults: 1,
				children: 0,
				infants: 0,
				arrival: '2018-11-28',
				departure: '2018-11-30',
				currency: 'RON',
			}, options);
			
			init();
			
			// maintain chainability
			return this;
		}
	});
	
	//auth & get the rooms
	function init() {
		$elem_inner = $('<div class="imemento-wrapper"></div>')
		
		$elem
			.addClass(`imemento-booking im-theme-${o.theme} loading`)
			.css({minHeight: o.min_height})
			.append($elem_inner);
		
		//create the initial data object
		data = {
			hotel_id: o.hid,
			currency: o.currency,
			num_adults: o.adults,
			num_children: o.children,
			arrival_date: o.arrival,
			departure_date: o.departure,
		};
		
		showSearch();
		
		//chain ajax calls
		auth()
			.then(getStatic)
			.then(getRooms)
			.then(showRooms);
	}
	
	//update new search params and show the new rooms
	function search(form_data) {
		o = $.extend(o, form_data);
		
		getRooms()
			.then(showRooms);
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
			//console.log(response);
			statics = response;
		})
	}
	
	//get and show the rooms
	function getRooms() {
		
		return $.ajax({
			method: 'GET',
			dataType: 'json',
			url: endpoints.bookings + `/search/hotels/${o.hid}?start=${o.arrival}&stop=${o.departure}&currency=${o.currency}`,
			headers: {
				Authorization: 'Bearer ' + jwt,
			},
		})
			.fail(function (error) {
				console.log(error);
			})
			.done(function (response) {
				//console.log(response);
				rooms = response;
			})
	}
	
	//toggles the loading status
	function loading(status) {
		$elem.toggleClass('loading', status);
	}
	
	//show an error message
	function showError(msg) {
		alert(msg);
	}
	
	//show the search form
	function showSearch() {
		$search = `
<div class="imemento-search">
	<form class="pure-form pure-form-stacked">
		<div class="pure-g">
            <div class="pure-u-1 pure-u-md-6-24">
                <label>Sosire</label>
                <input class="pure-u-1" type="date" value="${o.arrival}" name="arrival" required>
            </div>
            <div class="pure-u-1 pure-u-md-6-24">
                <label>Plecare</label>
                <input class="pure-u-1" type="date" value="${o.departure}" name="departure" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
                <label>Adulti</label>
                <input class="pure-u-1" type="number" value="${o.adults}" name="adults" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
                <label>Copii</label>
                <input class="pure-u-1" type="number" value="${o.children}" name="children" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
                <label>Infanti</label>
                <input class="pure-u-1" type="number" value="${o.infants}" name="infants" required>
            </div>
            <div class="pure-u-1 pure-u-md-3-24">
				<button type="submit" class="pure-button pure-button-primary imemento-block imemento-search-button">Cauta</button>
            </div>
        </div>
	</form>
</div>
				`;
		
		$elem.prepend($search);
	}
	
	//shows all the rooms and rates
	function showRooms() {
		
		if (! rooms.all_rooms) {
			showError('Nu sunt camere disponibile.');
			return;
		}
		
		$rooms = $('<div class="imemento-rooms"></div>');
		
		//create each room
		rooms.all_rooms.forEach(function (room) {
			
			//get static info
			let room_statics = statics.rooms.filter(function(sroom) {
				return sroom.id === room.room_id;
			});
			
			let img_src; //todo placeholder
			if (room_statics.length > 0)
				img_src = room_statics[0].media[0].url.medium;
			
			let $room = $(`
<div class="imemento-room pure-g">
	<div class="imemento-room-image pure-u-1 pure-u-sm-3-24">
		<img src="${img_src}" alt="" class="pure-img imemento-full-width" />
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
				
				//quantity select
				let $quantity = $('<select name="quantity" />');
				for (let i=0; i < room.number_rooms; i++) {
					$quantity.append(`<option value="${i+1}">${i+1}</option>`);
				}
				
				let $rate = $(`
<div class="imemento-rate pure-g">
	<div class="pure-u-12-24 pure-u-sm-18-24">
		<span class="imemento-block">${rate.rate_plan_name}</span>
		<span class="imemento-block">${rate.value} ${rate.currency}</span>
	</div>
	<form class="pure-u-12-24 pure-u-sm-6-24 imemento-text-right pure-form">
		<input type="hidden" name="room_id" value="${room.room_id}">
		<input type="hidden" name="rate_id" value="${rate.rate_plan_id}">
		<input type="hidden" name="price" value="${rate.value}">
		<button type="submit" class="pure-button pure-button-success imemento-book-button">Rezerva</button>
	</form>
</div>
						`);
				
				$rate.find('.pure-form').prepend($quantity);
				$room.children('.imemento-rates').append($rate);
			});
			
			$rooms.append($room);
		});
		
		$elem_inner.html($rooms);
		$elem_inner.append('<p class="imemento-help-text">Toate preturile sunt per noapte per camera.</p>');
		loading(false);
	}
	
	//shows the booking form
	function showBooking(d) {
		
		//calculate total price and add the room info to main data
		data.total_price = d.price * parseInt(d.quantity);
		data.room_types = [{
			id: d.room_id,
			rate_plan_id: d.rate_id,
			quantity: d.quantity,
			total_price: data.total_price,
			currency: data.currency,
			services: [],
		}];
		
		$booking = `
<div class="imemento-book">
	<form class="pure-form pure-form-stacked">
		<div class="pure-g">
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-left">
                <label>Prenume *</label>
                <input class="pure-u-1" type="text" name="first_name" required>
            </div>
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-right">
                <label>Nume *</label>
                <input class="pure-u-1" type="text" name="last_name" required>
            </div>
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-left">
                <label>Email *</label>
                <input class="pure-u-1" type="email" name="email" required>
            </div>
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-right">
                <label>Telefon</label>
                <input class="pure-u-1" type="text" name="phone">
            </div>
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-left">
                <label>Adresa</label>
                <input class="pure-u-1" type="text" name="address" required>
            </div>
            <div class="pure-u-1 pure-u-md-12-24 imemento-col-right">
                <label>Localitate</label>
                <input class="pure-u-1" type="text" name="location" required>
            </div>
            <div class="pure-u-1">
                <label>Observatii</label>
                <textarea class="pure-u-1" name="observations"></textarea>
            </div>
		</div>
		<div class="imemento-actions">
			<a class="pure-button pure-button imemento-back-button">Inapoi</a>
			<button type="submit" class="pure-button pure-button-success imemento-confirm-button imemento-pull-right">Rezerva</button>
		</div>
	</form>
</div>
				`;
		
		$elem_inner.html($booking);
	}
	
	//make the prebook call and get the booking id
	function prebook() {
		return $.ajax({
			method: 'POST',
			data: JSON.stringify(data), //ignores empty arrays otherwise
			contentType: 'application/json',
			url: endpoints.bookings + `/reservations/prebook`,
			headers: {
				Authorization: 'Bearer ' + jwt,
				Accept: 'application/json',
			},
		})
		.fail(function (error) {
			console.log(error);
		})
		.done(function (response) {
			//console.log(response);
			data.id = response.id;
		})
	}
	
	//make the actual booking
	function book() {
		return $.ajax({
			method: 'PUT',
			data: JSON.stringify(data),
			contentType: 'application/json',
			url: endpoints.bookings + `/reservations/${data.id}/book`,
			headers: {
				Authorization: 'Bearer ' + jwt,
				Accept: 'application/json',
			},
		})
		.fail(function (error) {
			console.log(error);
		})
		.done(function (response) {
			//console.log(response);
			loading(false);
		})
	}
	
	//show the final confirmation page
	function showConfirm() {
		$confirm = `
<div class="imemento-confirm">
	<h1>:)</h1>
	<h3>Rezervarea a fost efectuata.</h3>
	<p>O sa primiti un email cu informatiile complete in cel mai scurt timp.</p>
</div>
		`;
		
		$elem_inner.html($confirm);
	}
	
	//parse from serializeArray to key => value
	function parseToKeyValue(d) {
		return d.reduce(function(obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});
	}
	
	
	
	//search rooms
	$(document).on('click', '.imemento-search-button', function(e) {
		e.preventDefault();
		loading(true);
		
		let d = $(this).closest('form').serializeArray();
		search(parseToKeyValue(d));
	});
	
	//when the user clicks on the book button for a room-rate combination
	$(document).on('click', '.imemento-book-button', function(e) {
		let d = $(this).closest('form').serializeArray();
		showBooking(parseToKeyValue(d));
	});
	
	//go back to rooms
	$(document).on('click', '.imemento-back-button', function(e) {
		showRooms();
	});
	
	//make the booking and show a confirmation page
	$(document).on('click', '.imemento-confirm-button', function(e) {
		e.preventDefault();
		loading(true);
		
		let d = parseToKeyValue($(this).closest('form').serializeArray());
		
		//get customer info
		data.customer = {
			name: d.first_name +' '+ d.last_name,
			email: d.email,
			phone: d.phone,
			country: 'RO',
			city: d.location,
			address: d.address,
			observations: d.observations,
		};
		
		//empty payment info
		data.payment = [];
		
		prebook()
			.then(book)
			.then(showConfirm);
	});
	
}(jQuery));