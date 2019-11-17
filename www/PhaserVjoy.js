/* global Phaser */

(function (window, Phaser) {
	'use strict';

	/**
	 * Virtual Joystick plugin for Phaser.io
	 */

	Phaser.Plugin.VJoy = function (game, parent) {
		Phaser.Plugin.call(this, game, parent);

		this.body = this.game.add.sprite(60, 220, 'vjoy_body');
		this.body.anchor.set(0.5);
		this.body.fixedToCamera = true;
		this.body.inputEnabled = true;

		this.position = new Phaser.Point(60, 220);

		this.cap = this.game.add.sprite(0, 0, 'vjoy_cap');
		this.cap.anchor.set(0.5);
		this.cap.fixedToCamera = true;
		this.cap.cameraOffset.x = this.position.x;
		this.cap.cameraOffset.y = this.position.y;

		this.input = this.game.input;
		this.input.onDown.add(createCompass, this);
		this.input.onUp.add(removeCompass, this);

		this.speed = {
			x: 0,
			y: 0
		}
	};

	Phaser.Plugin.VJoy.prototype = Object.create(Phaser.Plugin.prototype);
	Phaser.Plugin.VJoy.prototype.constructor = Phaser.Plugin.VJoy;

	Phaser.Plugin.VJoy.prototype.enable = function() {}

	var createCompass = function(pointer) {
		var d = this.position.distance(this.input.activePointer.position);
		if(this.pointer || d > this.body.width/2) return;

		this.pointer = pointer;
		this.preUpdate = setDirection.bind(this);

		this.cap.cameraOffset.x = this.position.x;
		this.cap.cameraOffset.y = this.position.y;
	};

	var removeCompass = function () {
		this.isDown = false;

		this.speed.x = 0;
		this.speed.y = 0;
		this.speed.force = 0;

		this.cap.cameraOffset.x = this.position.x;
		this.cap.cameraOffset.y = this.position.y;

		this.preUpdate = empty;
		this.pointer = null;
	};

	var empty = function () {
	};

	var setDirection = function() {
		var d = this.position.distance(this.pointer.position);

		var deltaX = this.pointer.position.x - this.position.x;
		var deltaY = this.pointer.position.y - this.position.y;

		this.isDown = true;
		this.rotation = this.position.angle(this.pointer.position);

		if(d > this.body.width/2) {
			deltaX = Math.cos(this.rotation) * this.body.width/2;
			deltaY = Math.sin(this.rotation) * this.body.width/2;
		}

		this.speed.x = parseInt((deltaX / this.body.width/2) * -100, 10);
		this.speed.y = parseInt((deltaY / this.body.width/2) * -100, 10);
		this.cap.cameraOffset.x = this.position.x + deltaX;
		this.cap.cameraOffset.y = this.position.y + deltaY;
	};

	Phaser.Plugin.VJoy.prototype.preUpdate = empty;

}.call(this, window, Phaser));