(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class Death {
	constructor(level, x, y, type = 'death', table) {
		this.hp = 1;
		this.level = level;
		this.sprite = this.level.add.sprite(x, y, 'death');

		this.sprite.anchor.set(1, 0.5);
		this.sprite.smoothed = false;
		this.sprite.class = this;
		this.level.physics.arcade.enable(this.sprite);
		this.sprite.body.gravity.y = 1000;

		this.window = this.level.make.sprite(0, -10, table);
		this.window.anchor.set(0.5, 1);
		this.window.smoothed = false;
		this.window.alpha = 0;
		this.sprite.addChild(this.window);
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		// drops organs...
	}

	update() {
		this.level.physics.arcade.collide(this.sprite, this.level.solids);

		this.window.alpha = 0;
		this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, (_, pl) => {
			this.window.alpha = 1;
		});
	}
}

module.exports = Death;

},{}],2:[function(require,module,exports){
const Entity = require('./Entity');

class Enemy extends Entity {
	constructor(level, x, y, type = 'enemy') {
		super(level, x, y, type);
		if (this.weapon) this.weapon.weapon.fireRate = 300;
		this.dir = 1;
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		this.level.dropOrgan(x, y, rotation);
		this.level.dropOrgan(x, y, rotation);
		Math.random() < 0.5 && this.level.dropOrgan(x, y, rotation);
		// drops organs...
	}

	update() {
		this.level.physics.arcade.collide(this.sprite, this.level.solids);
		this.level.physics.arcade.overlap(this.sprite, this.level.enemies, (_, en) => {
			if (en.class.type === 'slave') {
				en.class.dead();
				this.dead();
			}
		});
		this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, (_, pl) => pl.class.dead());

		const { x, y } = this.level.mainHero.position;
		const rightTile = this.level.map.getTileWorldXY(this.sprite.x + 16, this.sprite.y);
		const leftTile = this.level.map.getTileWorldXY(this.sprite.x - 16, this.sprite.y);
		const rightBottomTile = this.level.map.getTileWorldXY(this.sprite.x + 16, this.sprite.y + 16);
		const leftBottomTile = this.level.map.getTileWorldXY(this.sprite.x - 16, this.sprite.y + 16);

		if (rightTile || !rightBottomTile) this.dir = -1;
		if (leftTile || !leftBottomTile) this.dir = 1;
		this.sprite.body.velocity.x = 80 * this.dir;
		this.sprite.scale.x = this.dir * -1;

		// else this.body.velocity.x = 0;

		// this.weapon.update(this.game.physics.arcade.angleToXY(this.weapon.sprite, x, y));

		// if (this.game.math.distance(x, y, this.sprite.x, this.sprite.y) < 150) {
		// 	!this.isDead && this.weapon.fire();
		// }
	}
}

module.exports = Enemy;

},{"./Entity":3}],3:[function(require,module,exports){
const Weapon = require('./Weapon.js');
const entities = require('./entities.json');

class Entity {
	constructor(level, x, y, type, isWeapon = true) {
		this.type = type;
		this.level = level;
		this.game = level.game;
		this._entity = entities[type];

		this.x = x || 0;
		this.y = y || 0;
		this.speed = this._entity.speed || 100;
		this.hp = this._entity.hp || 1;
		this.radiusVisibility = 100;
		this.isJumping = false;
		this.isDead = false;

		this.weaponId = this._entity.weapon != null ? this._entity.weapon : 'gun';
		this._createPhaserObjects();
	}

	_createPhaserObjects() {
		this.sprite = this.level.add.sprite(this.x, this.y, this._entity.texture);
		this.sprite.anchor.set(0.5);
		this.sprite.smoothed = false;
		this.sprite.class = this;

		if (this._entity.weapon) this.weapon = new Weapon(this, this.weaponId);

		this.level.physics.arcade.enable(this.sprite);
		this.sprite.body.gravity.y = 1000;
		this.sprite.body.drag.set(150);
		this.sprite.body.maxVelocity.set(1000);
		this.sprite.body.width = 16;
		this.sprite.body.height = 16;
		this.sprite.syncBounds = true;
	}

	_update() {
		if (this.isDead) return;

		// collision person with bullets
		let bullets = this.level.bullets.children;
		for (let i = 0; i < bullets.length; i++) {
			if (
				this.constructor.name === bullets[i].typeOwner ||
				(this.constructor.name === 'Slave' && bullets[i].typeOwner === 'Player')
			)
				continue;

			this.level.physics.arcade.overlap(bullets[i], this.sprite, (person, bullet) => {
				this.sprite.body.velocity.x += Math.cos(this.sprite.rotation) * 10;
				this.sprite.body.velocity.y += Math.sin(this.sprite.rotation) * 10;
				this.hp--;
				if (this.hp === 0) this.dead(bullet.rotation);
				bullet.kill();
			});
		}

		// extends update!
		this.update && this.update();
	}

	dead(rotation) {
		this.isDead = true;
		this.onDead && this.onDead(rotation);
		this.sprite.kill();
		if (this.weapon) {
			this.weapon.sprite.kill();
			this.weapon.weapon.destroy();
		}
	}
}

module.exports = Entity;

},{"./Weapon.js":8,"./entities.json":9}],4:[function(require,module,exports){
class Fire {
	constructor(level, x, y, type = 'fire') {
		this.hp = 1;
		this.level = level;
		this.sprite = this.level.add.sprite(x, y, 'fire_blue', 1);
		const anim = this.sprite.animations.add('default');
		anim.play(10, true);

		this.sprite.anchor.set(1, 0.5);
		this.sprite.smoothed = false;
		this.sprite.class = this;
		this.level.physics.arcade.enable(this.sprite);
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		// drops organs...
	}

	update() {
		this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, (_, pl) => pl.class.dead());
		this.level.physics.arcade.overlap(this.sprite, this.level.enemies, (_, en) => {
			if (en.class.type === 'slave') {
				en.class.dead();
				this.sprite.kill();
			}
		});
	}
}

module.exports = Fire;

},{}],5:[function(require,module,exports){
const Entity = require('./Entity');

class Fly extends Entity {
	constructor(level, x, y) {
		super(level, x, y, Math.random() < 0.5 ? 'gluz' : 'chiripakha');
		this.start = [x, y];
		this.attackMode = true;
		this.timer = 0;
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		this.level.dropOrgan(x, y, rotation);
		this.level.dropOrgan(x, y, rotation);
		this.level.dropOrgan(x, y, rotation);
		//console.log('DEAD!');
		// drops organs...
	}

	targetEnemy(x, y) {
		const slaves = this.level.enemies.children.filter(e => e.class.type === 'slave' && !e.class.isDead);
		const slave = slaves[Math.floor(Math.random() * slaves.length)];
		this.track = slave ? slave.sprite : this.level.player.sprite;
	}

	update() {
		if (!this.track || this.track.class.isDead) return this.targetEnemy();
		if (this.level.game.math.distance(this.track.x, this.track.y, this.sprite.x, this.sprite.y) > 300) {
			this.sprite.position.x = this.start[0];
			this.sprite.position.y = this.start[1];
			return;
		}

		if (this.timer > 100) {
			this.timer = 0;
			this.attackMode = true;
		} else this.timer++;

		this.level.physics.arcade.overlap(this.sprite, this.level.enemies, (_, en) => {
			if (en.class.type === 'slave') {
				en.class.dead();
				this.attackMode = false;
			}
		});

		this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, (_, pl) => pl.class.dead());
		const angle = this.level.physics.arcade.moveToXY(
			this.sprite,
			this.track.x,
			this.track.y - (this.attackMode ? 0 : 120),
			this.speed
		);

		// bullets
		let bullets = this.level.bullets.children;
		for (let i = 0; i < bullets.length; i++) {
			if (
				this.constructor.name === bullets[i].typeOwner ||
				(this.constructor.name === 'Slave' && bullets[i].typeOwner === 'Player')
			)
				continue;

			this.level.physics.arcade.overlap(bullets[i], this.sprite, (person, bullet) => {
				this.sprite.body.velocity.x += Math.cos(this.sprite.rotation) * 10;
				this.sprite.body.velocity.y += Math.sin(this.sprite.rotation) * 10;
				this.dead(bullet.rotation);
				bullet.kill();
			});
		}

		// const rightTile = this.level.map.getTileWorldXY(this.sprite.x + 16, this.sprite.y);
		// const leftTile = this.level.map.getTileWorldXY(this.sprite.x - 16, this.sprite.y);
		// if (rightTile) this.dir = -1;
		// if (leftTile) this.dir = 1;
		// this.sprite.body.velocity.x = 80 * this.dir;
		// this.sprite.scale.x = this.dir * -1;

		// else this.body.velocity.x = 0;

		// this.weapon.update(this.game.physics.arcade.angleToXY(this.weapon.sprite, x, y));

		// if (this.game.math.distance(x, y, this.sprite.x, this.sprite.y) < 150) {
		// 	!this.isDead && this.weapon.fire();
		// }
	}
}

module.exports = Fly;

},{"./Entity":3}],6:[function(require,module,exports){
const Entity = require('./Entity.js');
const UI = require('../mixins/UI');

class Player extends Entity {
	constructor(level, x, y) {
		super(level, x, y, 'player');
		this.organs = [];
	}

	update() {
		if (this.sprite.y > 300) {
			this.dead();
		}

		this.level.physics.arcade.collide(this.sprite, this.level.solids);

		this.sprite.scale.x = this.sprite.body.velocity.x < 0 ? -1 : 1;
		const angle = this.game.physics.arcade.angleToPointer(this.weapon.sprite);
		if (angle < -1.8 || angle > 1.4) this.sprite.scale.x = -1;
		else this.sprite.scale.x = 1;

		this.weapon.update(angle);

		// Items use
		this.level.physics.arcade.overlap(this.sprite, this.level.items, (sprite, item) => {
			item.kill();
			this.organs.push(item.type);
			UI.organs++;
			this.level.addSlave(this.sprite.position.x, this.sprite.position.y);
		});
	}

	onWounded() {}

	onDead() {
		UI.isDead = true;
		this.level.restructSlaves();
		this.level.state.start('Home');
	}
}

module.exports = Player;

},{"../mixins/UI":12,"./Entity.js":3}],7:[function(require,module,exports){
const Entity = require('./Entity.js');

class Slave extends Entity {
	constructor(level, x, y, index, limit) {
		super(level, x, y, 'slave', false);
		this.index = index;
		this.limit = limit;
		this.stopMove = false;
		this.notActive = false;
	}

	update() {
		if (this.sprite.isMainHero) this.notActive = true;
		if (this.notActive) {
			this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, () => {
				this.notActive = false;
				this.index = this.level.controls.length - this.limit;
			});
		}

		this.level.physics.arcade.collide(this.sprite, this.level.solids);
		if (this.notActive || this.sprite.isMainHero || !this.level.isPlayerMain) return;

		// const { x, y } = this.level.mainHero.position;
		// const velX = this.level.mainHero.body.velocity.x;
		//if (!velX) return;

		const [x, y, isGroud] = this.level.controls[this.index];
		if (!this.stopMove) {
			this.sprite.scale.x = x - this.sprite.position.x < 0 ? -1 : 1;
			this.sprite.position.x = x;
			this.sprite.position.y = y;
		}

		if (!isGroud || this.index < this.level.controls.length - this.limit) {
			if (this.index < this.level.controls.length - 1) {
				this.index++;
				this.stopMove = false;
			} else this.stopMove = true;
		} else this.stopMove = true;

		// const rightTile = this.level.map.getTileWorldXY(this.sprite.x + 16, this.sprite.y) || {};
		// const leftTile = this.level.map.getTileWorldXY(this.sprite.x - 16, this.sprite.y) || {};
		// const downLeftTile = this.level.map.getTileWorldXY(this.sprite.x + 16, this.sprite.y + 16);
		// const downRightTile = this.level.map.getTileWorldXY(this.sprite.x - 16, this.sprite.y + 16);

		// if (this.sprite.body.onFloor()) {
		// 	if (!downLeftTile || leftTile.canCollide) {
		// 		this.sprite.body.velocity.y = -400;
		// 		this.sprite.body.velocity.x = -150;
		// 	}
		// 	if (!downRightTile || rightTile.canCollide) {
		// 		this.sprite.body.velocity.y = -400;
		// 		this.sprite.body.velocity.x = 150;
		// 	}
		// }

		// this.sprite.body.velocity.x = velX;

		// if (this.jumpButton.isDown && this.sprite.body.onFloor() && this.game.time.now > this.jumpTimer) {
		// 	this.sprite.body.velocity.y = -1000;
		// 	this.jumpTimer = this.game.time.now + 500;
		// }
	}

	onDead() {
		if (this.sprite.isMainHero) this.level.swapHero(true);
	}
}

module.exports = Slave;

},{"./Entity.js":3}],8:[function(require,module,exports){
const weapons = require('./weapons.json');

class Weapon {
	constructor(person, type) {
		this.level = person.level;
		this.game = this.level.game;
		this.person = person;

		this.sprite = this.level.add.sprite(0, 0, 'gun');
		this.sprite.anchor.set(0.5);
		this.sprite.smoothed = false;

		this._weapons = weapons[type];
		this.id = this._weapons.id != null ? this._weapons.id : 0;
		this.trackX = this._weapons.trackX != null ? this._weapons.trackX : 16;
		this.trackY = this._weapons.trackY != null ? this._weapons.trackY : 4;
		this.speed = this._weapons.speed != null ? this._weapons.speed : 100;
		this.damage = this._weapons.damage != null ? this._weapons.damage : 1;
		this.delay = this._weapons.delay != null ? this._weapons.delay : 10;
		this.quantity = this._weapons.quantity != null ? this._weapons.quantity : 1;

		this.weapon = this.level.add.weapon(100, 'bullet', null, this.level.bullets);
		this.weapon.setBulletFrames(this.id, this.id, true);
		this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
		this.weapon.bulletSpeed = this.speed;
		this.weapon.fireRate = this.delay;
		this.weapon.bullets.typeOwner = this.person.constructor.name;

		this.weapon.trackSprite(this.person.sprite);
	}

	updateTrack(x, y) {
		this.sprite.angle = this.level.game.angleBetween(this.sprite);
	}

	fire(x, y) {
		let bullet = this.weapon.fire();
		return true;
		// if (bullet) {
		// 	this.person.sprite.body.velocity.x -= Math.cos(this.sprite.rotation) * 100;
		// 	this.person.sprite.body.velocity.y -= Math.sin(this.sprite.rotation) * 100;
		// 	return true;
		// }
	}
	update(angle) {
		const { x, y } = this.person.sprite.position;
		this.sprite.position.set(x, y + 3);
		this.sprite.rotation = angle;
		this.weapon.fireAngle = this.game.math.radToDeg(angle);

		this.level.physics.arcade.collide(this.weapon.bullets, this.level.solids, (bullet, tile) => {
			bullet.kill();
		});
	}
}

module.exports = Weapon;

},{"./weapons.json":10}],9:[function(require,module,exports){
module.exports={
	"player": {
		"texture": "player",
		"jump": 3,
		"speed": 100,
		"hp": 1,
		"weapon": "gun"
	},
	"slave": {
		"texture": "zombi",
		"jump": 3,
		"speed": 100,
		"hp": 1,
		"weapon": ""
	},
	"enemy": {
		"texture": "demon",
		"jump": 3,
		"speed": 100,
		"hp": 1,
		"radiusVisibility": 150,
		"weapon": ""
	},
	"gluz": {
		"texture": "gluz",
		"speed": 70,
		"hp": 2,
		"weapon": ""
	},
	"chiripakha": {
		"texture": "chiripakha",
		"speed": 100,
		"hp": 1,
		"weapon": ""
	}
}

},{}],10:[function(require,module,exports){
module.exports={
	"gun": {
		"id": 1,
		"range": 100,
		"speed": 400,
		"damage": 10,
		"delay": 400,
		"quantity": 10,
		"trackX": 1,
		"trackY": 1
	}
}

},{}],11:[function(require,module,exports){
const Boot = require('./states/Boot.js');
const Preload = require('./states/Preload.js');
const Menu = require('./states/Menu.js');
const Level = require('./states/Level.js');
const Home = require('./states/Home.js');

var ready = () => {
	var game = new Phaser.Game(480, 14 * 16, Phaser.AUTO, 'ShooterBlink');

	game.state.add('Menu', Menu);
	game.state.add('Home', Home);
	game.state.add('Level', Level);
	game.state.add('Preload', Preload);
	game.state.add('Boot', Boot, true);
};

ready();

},{"./states/Boot.js":13,"./states/Home.js":14,"./states/Level.js":15,"./states/Menu.js":16,"./states/Preload.js":17}],12:[function(require,module,exports){
var UI = {
	level: 1,
	bullets: 10,
	organs: 0,
	isDead: true,

	addTextButton: (x = 0, y = 0, text, textFamily, fontSize = 30, cb) => {
		let txt = UI.addText(x, y, text, textFamily, fontSize);
		UI.setButton(txt, cb);
		return txt;
	},

	addText: (x = 0, y = 0, text, textFamily, fontSize = 30, fill = '#fff') => {
		let txt = UI.game.add.text(x, y, text, { textFamily, fontSize, fill });
		txt.smoothed = false;
		txt.anchor.set(0.5);
		return txt;
	},

	addIconButton: (x = 0, y = 0, key, index, cb) => {
		let sprite = UI.game.add.sprite(x, y, key, index);
		sprite.smoothed = false;
		sprite.scale.set(1.5);
		UI.setButton(sprite, cb);
		return sprite;
	},

	setButton: (obj, cb) => {
		obj.inputEnabled = true;
		let x = obj.scale.x;
		let y = obj.scale.y;

		obj.events.onInputDown.add(() => {
			if (obj.disable) return;
			UI.game.add
				.tween(obj.scale)
				.to({ x: x + 0.3, y: y + 0.3 }, 300)
				.start();
		});
		obj.events.onInputUp.add(() => {
			if (obj.disable) return;
			cb();
		});
		obj.events.onInputOver.add(() => {
			if (obj.disable) return;
			UI.game.add
				.tween(obj.scale)
				.to({ x: x + 0.3, y: y + 0.3 }, 300)
				.start();
		});
		obj.events.onInputOut.add(() => {
			if (obj.disable) return;
			UI.game.add
				.tween(obj.scale)
				.to({ x: x, y: y }, 300)
				.start();
		});
	}
};

module.exports = UI;

},{}],13:[function(require,module,exports){
const UI = require('../mixins/UI');

class Boot {
	init() {
		this.w = 480;
		this.h = 15 * 16;
		UI.game = this.game;
	}

	create() {
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		this.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;
		this.scale.setMaximum();

		this.game.renderer.renderSession.roundPixels = true;
		Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

		this.state.start('Preload');
	}
}

module.exports = Boot;

},{"../mixins/UI":12}],14:[function(require,module,exports){
const UI = require('../mixins/UI.js');

const LIVER = 'pechen';
const HEART = 'serdechko';
const STOMACH = 'zheludok';
const BRAIN = 'mozg';

class Home {
	create() {
		this.world.setBounds(0, 0, 480, 320);
		this.screen = this.add.sprite(0, 0, 'screen');
		this.screen.scale.set(2);
		this.screen.smoothed = false;
		this.screen.anchor.set(0.5);
		this.screen.x = 480 / 2;
		this.screen.y = 240 / 2;

		this.patry = this.add.sprite(0, 0, 'patry');
		this.patry.scale.set(2);
		this.patry.smoothed = false;
		this.patry.anchor.set(0.5);
		this.patry.x = 480 / 2 - 80;
		this.patry.y = 240 / 2;

		this.pay = this.add.sprite(0, 0, 'pay');
		this.pay.scale.set(2);
		this.pay.smoothed = false;
		this.pay.anchor.set(0.5);
		this.pay.x = 480 / 2 + 80;
		this.pay.y = 240 / 2;
		this.pay.inputEnabled = true;
		this.pay.events.onInputUp.add(() => {
			if (!UI.organs) return;
			UI.organs -= 1;
			UI.bullets += 2;
		});

		this.start = this.add.sprite(0, 0, 'start');
		this.start.scale.set(2);
		this.start.smoothed = false;
		this.start.anchor.set(0.5);
		this.start.x = 480 / 2 + 80;
		this.start.y = 240 / 2 + 50;
		this.start.inputEnabled = true;
		this.start.events.onInputUp.add(() => {
			this.state.start('Level');
		});

		const news = ['Хакатон от DTF! Собирайте команду!'];
		const text = news[Math.floor(Math.random() * news.length)];
		UI.addText(110, 48, text, 'Arial', 14, '#000').anchor.set(0, 0);

		//UI.addText(140, 120, 'Магазин', 'Arial', 14, '#000');

		//UI.addText(110, 140, '2 патроны = 1 орган', 'Arial', 14, '#000').anchor.set(0, 0);
		// UI.addTextButton(300, 140, 'Обменять', 'Arial', 14, () => {
		// 	if (!UI.organs) return;
		// 	UI.organs -= 1;
		// 	UI.bullets += 2;
		// }).anchor.set(0, 0);

		// this.bg = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');

		// this.labelPath1 = UI.addText(160, 50, 'font', 'BLINK', 35);
		// this.add.tween(this.labelPath1)
		// 	.to({alpha: 0}, 200)
		// 	.to({alpha: 1}, 100)
		// 	.start()
		// 	.loop();

		// this.labelPart2 = UI.addText(320, 55, 'font', 'SHOOTER', 25);

		// this.btnStart = UI.addTextButton(this.world.centerX, this.world.centerY-35, 'font', 'START', 30, () => {
		// 	this.state.start('LevelManager');
		// });
		// this.btnSettings = UI.addTextButton(this.world.centerX, this.world.centerY+10, 'font', 'SETTINGS', 30, () => {
		// 	this.state.start('Settings');
		// });

		// this.info = UI.addText(10, 5, 'font2', 'Powered by azbang @v0.1', 14);
		// this.info.anchor.set(0);

		// UI.addTextButton(300, 220, 'НАЧАТЬ >', 'Arial', 14, () => {
		// 	this.state.start('Level');
		// }).anchor.set(0, 0);

		let start = 105;
		let y = 180;
		const minipalya = this.add.sprite(start + 30, y, 'minipalya');
		minipalya.scale.set(2);
		minipalya.anchor.set(0.5);
		minipalya.fixedToCamera = true;
		minipalya.smoothed = false;
		this.bulletsText = UI.addText(start + 34, y + 3, UI.bullets, 'Arial', 14, '#00');
		this.bulletsText.fixedToCamera = true;
		this.bulletsText.anchor.set(0, 0.5);

		const minimozg = this.add.sprite(start + 90, y, 'minimozg');
		minimozg.scale.set(2);
		minimozg.anchor.set(0.5);
		minimozg.fixedToCamera = true;
		minimozg.smoothed = false;
		this.organsText = UI.addText(start + 94, y + 3, 0, 'Arial', 14, '#ff0000');
		this.organsText.fixedToCamera = true;
		this.organsText.anchor.set(0, 0.5);
	}
	update() {
		this.bulletsText.text = UI.bullets;
		this.organsText.text = UI.organs;
	}
}

module.exports = Home;

},{"../mixins/UI.js":12}],15:[function(require,module,exports){
const Player = require('../game/Player');
const Enemy = require('../game/Enemy');
const Slave = require('../game/Slave');
const Fire = require('../game/Fire');
const Fly = require('../game/Fly');
const Death = require('../game/Death');

const UI = require('../mixins/UI');

const LIVER = 'pechen';
const HEART = 'serdechko';
const STOMACH = 'zheludok';
const BRAIN = 'mozg';

class Level {
	create() {
		let lvl = Math.floor(Math.random() * 3) + 1;
		if (UI.notFirstLevel) {
			// САМАЯ ТУПАЯ ГЕНЕРАЦИЯ
			if (UI.isDead) {
				lvl = 'home';
			} else {
				while (lvl === UI.lastLvl) {
					lvl = Math.floor(Math.random() * 3) + 1;
				}
				UI.lastLvl = lvl;
			}

			lvl = UI.isDead ? lvl : 'level' + lvl;
			UI.isDead = false;
		} else lvl = 'level1';
		UI.notFirstLevel = true;

		this.map = this.game.add.tilemap(lvl, 16, 16);
		this.map.addTilesetImage('tilemap');
		//	this.map.debugMap = true;

		//this.game.camera.bounds = null;
		//this.game.camera.bounds.setTo(-Infinity, -Infinity, Infinity, Infinity);

		// FUCKING PHASER! I HATE U BITCH
		this.game.add.sprite(0, 0, 'bg').fixedToCamera = true;
		this.game.add.sprite(224, 0, 'bg').fixedToCamera = true;
		this.game.add.sprite(224 * 2, 0, 'bg').fixedToCamera = true;

		this.world.setBounds(0, 0, 30 * 16, 100 * 16);
		// this.camera.setBoundsToWorld	();

		this.solids = this.map.createLayer('solids');

		this.solids.resizeWorld();
		this.solids.smoothed = false;
		this.map.setCollisionBetween(0, 270, this.solids);

		this.decors = this.map.createLayer('decor');
		this.decors.resizeWorld();
		this.decors.smoothed = false;

		this.decors2 = this.map.createLayer('decor2');
		if (this.decors2) {
			this.decors2.resizeWorld();
			this.decors2.smoothed = false;
		}

		// PathFinders
		//let arr = [];
		//let props = this.map.tile	sets[0].tileProperties;
		//for (let i in props) {
		//	this.map.setCollision(+i, true, this.firstLayerMap);
		//}
		//this.pathfinder = this.game.plugins.add(Phaser.Plugin.PathFinderPlugin);
		//this.pathfinder.setGrid(this.map.layers[0].data, arr);

		// group
		this.bullets = this.add.group();
		this.enemies = this.game.add.group();
		this.items = this.add.group();
		this.elements = this.add.group();
		this.items.enableBody = true;

		this.swapButton = this.input.keyboard.addKey(Phaser.Keyboard.Z);
		this.jumpButton = this.input.keyboard.addKey(Phaser.Keyboard.W);
		this.leftButton = this.input.keyboard.addKey(Phaser.Keyboard.A);
		this.rightButton = this.input.keyboard.addKey(Phaser.Keyboard.D);
		this.isPlayerMain = true;

		this.diffSlave = 1;
		this.slaveLeft = 0;
		this.slaveRight = 0;

		this.controls = [];

		this.swapButton.onUp.add(() => this.swapHero());
		this._createEnemies();

		let start = 20;
		let y = 210;
		const minipalya = this.add.sprite(start + 30, y, 'minipalya');
		minipalya.scale.set(2);
		minipalya.anchor.set(0.5);
		minipalya.fixedToCamera = true;
		minipalya.smoothed = false;
		this.bulletsText = UI.addText(start + 34, y + 3, UI.bullets, 'Arial', 14, '#00');
		this.bulletsText.fixedToCamera = true;
		this.bulletsText.anchor.set(0, 0.5);

		const minimozg = this.add.sprite(start + 90, y, 'minimozg');
		minimozg.scale.set(2);
		minimozg.anchor.set(0.5);
		minimozg.fixedToCamera = true;
		minimozg.smoothed = false;
		this.organsText = UI.addText(start + 94, y + 3, 0, 'Arial', 14, '#ff0000');
		this.organsText.fixedToCamera = true;
		this.organsText.anchor.set(0, 0.5);
	}
	_createEnemies() {
		this.map.objects.spawn &&
			this.map.objects.spawn.forEach(spawn => {
				const args = [spawn.x + spawn.width / 2, spawn.y + spawn.height / 2, spawn.type, spawn.name];
				if (spawn.type === 'player') {
					this.player = new Player(this, ...args);
					this.mainHero = this.player.sprite;
					this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1);
					this.player.weapon.weapon.onFire.add(() => {
						UI.bullets -= 1;
					});
					this.controls.push([args[0], args[1], false]);
					this.structSlaves();
				} else if (spawn.type === 'fire') {
					this.elements.add(new Fire(this, ...args).sprite);
				} else if (spawn.type === 'finish') {
					this.finish = spawn;
				} else if (spawn.type === 'fly') {
					this.elements.add(new Fly(this, ...args).sprite);
				} else if (spawn.type === 'death') {
					this.elements.add(new Death(this, ...args).sprite);
				} else if (spawn.type === 'enemy') {
					let enemy = new Enemy(this, ...args);
					this.enemies.add(enemy.sprite);
				}
			});
	}

	swapHero(notSwap) {
		const slaves = this.enemies.children.filter(e => e.class.type === 'slave' && !e.class.isDead);
		const slave = slaves[Math.floor(Math.random() * slaves.length)];
		if (!slave) {
			this.mainHero.isMainHero = false;
			this.mainHero.body.velocity.y = 0;
			this.isPlayerMain = true;
			this.mainHero = this.player.sprite;
			this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1);
			this.mainHero.isMainHero = true;
			return;
		}

		this.mainHero.isMainHero = false;
		this.mainHero.body.velocity.y = 0;
		if (!notSwap) this.isPlayerMain = !this.isPlayerMain;
		this.mainHero = this.isPlayerMain ? this.player.sprite : slave;
		this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1);
		this.mainHero.isMainHero = true;
	}

	dropOrgan(x, y, rotation) {
		const types = [LIVER, HEART, STOMACH, BRAIN];
		const type = types[Math.floor(Math.random() * types.length)];
		const organ = this.add.sprite(x, y, type);
		this.physics.arcade.enable(organ);

		organ.body.gravity.y = 1000;
		organ.body.velocity.x -= this.random(-100, 100);
		organ.body.velocity.y -= this.random(10, 100);
		organ.type = type;
		this.items.add(organ);
	}

	random(min, max) {
		return Math.random() * (max - min) + -min;
	}

	addSlave() {
		if (UI.organs < 4) return;
		const slaves = this.enemies.children.filter(e => e.class.type === 'slave' && !e.class.isDead);
		const index = Math.max(this.controls.length - 10 * (slaves.length + 1), 0);
		const [x, y] = this.controls[index];
		let slave = new Slave(this, x, y, index, 10 * (slaves.length + 1));
		this.enemies.add(slave.sprite);
		UI.organs -= 4;
	}

	restructSlaves() {
		const slaves = this.enemies.children.filter(e => e.class.type === 'slave' && !e.class.isDead);
		UI.organs += slaves.length * 4;
	}

	structSlaves() {
		const slaves = Math.floor(UI.organs / 4);
		for (let i = 0; i < slaves; i++) {
			this.addSlave();
		}
	}

	updateControl() {
		if (this.isPlayerMain && (this.mainHero.body.velocity.x || this.mainHero.body.velocity.y))
			this.controls.push([this.player.sprite.x, this.player.sprite.y, this.mainHero.body.onFloor()]);

		this.mainHero.body.velocity.x = 0;

		if (this.leftButton.isDown) {
			this.mainHero.body.velocity.x = -150;
			this.mainHero.scale.x = -1;
		} else if (this.rightButton.isDown) {
			this.mainHero.body.velocity.x = 150;
			this.mainHero.scale.x = 1;
		}
		if (this.jumpButton.isDown && this.mainHero.body.onFloor()) {
			this.mainHero.body.velocity.y = -400;
		}

		if (UI.bullets && this.game.input.mousePointer.isDown && this.isPlayerMain && !this.mainHero.class.isDead) {
			this.mainHero.class.weapon.fire();
		}
	}

	update() {
		this.bulletsText.text = UI.bullets;
		this.organsText.text = UI.organs;

		this.player._update();
		for (let i = 0; i < this.enemies.children.length; i++) {
			this.enemies.children[i].class._update();
		}
		for (let i = 0; i < this.elements.children.length; i++) {
			this.elements.children[i].class.update();
		}
		this.physics.arcade.collide(this.items, this.solids, item => (item.body.velocity.x = 0));
		this.updateControl();

		const { x, y } = this.player.sprite.position;
		const rect = this.finish;
		if (x < rect.x + 16 && x + 16 > rect.x && y < rect.y + 16 && y + 16 > rect.y) {
			this.restructSlaves();
			this.state.restart('Level');
		}
		//this.physics.arcade.collide(this.enemies, this.enemies);
	}
}

module.exports = Level;

},{"../game/Death":1,"../game/Enemy":2,"../game/Fire":4,"../game/Fly":5,"../game/Player":6,"../game/Slave":7,"../mixins/UI":12}],16:[function(require,module,exports){
const UI = require('../mixins/UI.js');

class Menu {
	create() {
		this.world.setBounds(0, 0, 480, 320);
		// this.bg = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'bg');

		// this.labelPath1 = UI.addText(160, 50, 'font', 'BLINK', 35);
		// this.add.tween(this.labelPath1)
		// 	.to({alpha: 0}, 200)
		// 	.to({alpha: 1}, 100)
		// 	.start()
		// 	.loop();

		// this.labelPart2 = UI.addText(320, 55, 'font', 'SHOOTER', 25);

		// this.btnStart = UI.addTextButton(this.world.centerX, this.world.centerY-35, 'font', 'START', 30, () => {
		// 	this.state.start('LevelManager');
		// });
		// this.btnSettings = UI.addTextButton(this.world.centerX, this.world.centerY+10, 'font', 'SETTINGS', 30, () => {
		// 	this.state.start('Settings');
		// });

		// this.info = UI.addText(10, 5, 'font2', 'Powered by azbang @v0.1', 14);
		// this.info.anchor.set(0);
	}
	update() {}
}

module.exports = Menu;

},{"../mixins/UI.js":12}],17:[function(require,module,exports){
const UI = require('../mixins/UI.js');

class Preload {
	preload() {
		// Music
		// this.load.audio("music1", "./assets/music/theme-1.ogg");

		// Images
		// this.load.image("bg", "./assets/bg.png");

		//  UI
		// this.load.image("lifebox", "./assets/UI/lifebox.png");
		// this.load.image("liferect", "./assets/UI/liferect.png");
		// this.load.image("window", "./assets/UI/window.png");
		// this.load.image("vjoy_body", "./assets/UI/body.png");
		// this.load.image("vjoy_cap", "./assets/UI/button.png");
		// this.load.image("buttonJump", "./assets/UI/buttonJump.png");
		// this.load.image("buttonFire", "./assets/UI/buttonFire.png");

		// Animations
		// this.load.spritesheet("fx_fire", "./assets/animations/fire.png", 32, 33, 6);

		// Game Atlases
		// this.load.atlas(
		// 	"assets/",
		// 	"assets/atlases/items.png",
		// 	"assets/atlases/items.json",
		// 	Phaser.Loader.TEXTURE_ATLAS_JSON_HASH
		// );

		// Levels
		this.load.tilemap('level1', './assets/levels/level1.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.tilemap('level2', './assets/levels/level2.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.tilemap('level3', './assets/levels/level3.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.tilemap('level4', './assets/levels/level4.json', null, Phaser.Tilemap.TILED_JSON);
		this.load.tilemap('home', './assets/levels/home.json', null, Phaser.Tilemap.TILED_JSON);

		this.load.spritesheet('fire_blue', './assets/atlases/fire_blue.png', 16, 16, 4);

		this.load.image('tilemap', './assets/atlases/tilemap.png');
		this.load.image('bg', './assets/atlases/fon.png');
		this.load.image('player', './assets/atlases/player.png');
		this.load.image('gun', './assets/atlases/gun.png');
		this.load.image('bullet', './assets/atlases/bullet.png');
		this.load.image('pechen', './assets/atlases/pechen.png');
		this.load.image('serdechko', './assets/atlases/serdechko.png');
		this.load.image('zheludok', './assets/atlases/zheludok.png');
		this.load.image('mozg', './assets/atlases/mozg.png');
		this.load.image('demon', './assets/atlases/demon.png');
		this.load.image('zombi', './assets/atlases/zombi.png');
		this.load.image('chiripakha', './assets/atlases/chiripakha.png');
		this.load.image('gluz', './assets/atlases/gluz.png');
		this.load.image('death', './assets/atlases/death.png');
		this.load.image('minimozg', './assets/atlases/minimozg.png');
		this.load.image('minipalya', './assets/atlases/minipalya.png');
		this.load.image('minizambi', './assets/atlases/minizambi.png');
		this.load.image('nextLoc', './assets/atlases/nextLoc.png');
		this.load.image('screen', './assets/atlases/screen.png');
		this.load.image('patry', './assets/atlases/patry.png');

		this.load.image('tablichka1', './assets/atlases/tablichka1.png');
		this.load.image('tablichka2', './assets/atlases/tablichka2.png');
		this.load.image('newLoc', './assets/atlases/tablichka3.png');
		this.load.image('tablichka4', './assets/atlases/tablichka4.png');
		this.load.image('tablichka5', './assets/atlases/tablichka5.png');

		this.load.spritesheet('start', './assets/atlases/start.png', 50, 18);
		this.load.spritesheet('pay', './assets/atlases/pay.png', 50, 18);
	}

	create() {
		this.state.start('Home');
	}
}

module.exports = Preload;

},{"../mixins/UI.js":12}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0RlYXRoLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VuZW15LmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VudGl0eS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9GaXJlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0ZseS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9QbGF5ZXIuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvU2xhdmUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvV2VhcG9uLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL2VudGl0aWVzLmpzb24iLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvd2VhcG9ucy5qc29uIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9pbmRleC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvbWl4aW5zL1VJLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9zdGF0ZXMvQm9vdC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL0hvbWUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9MZXZlbC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL01lbnUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9QcmVsb2FkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY2xhc3MgRGVhdGgge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSA9ICdkZWF0aCcsIHRhYmxlKSB7XG5cdFx0dGhpcy5ocCA9IDE7XG5cdFx0dGhpcy5sZXZlbCA9IGxldmVsO1xuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKHgsIHksICdkZWF0aCcpO1xuXG5cdFx0dGhpcy5zcHJpdGUuYW5jaG9yLnNldCgxLCAwLjUpO1xuXHRcdHRoaXMuc3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUuY2xhc3MgPSB0aGlzO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMuc3ByaXRlKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LmdyYXZpdHkueSA9IDEwMDA7XG5cblx0XHR0aGlzLndpbmRvdyA9IHRoaXMubGV2ZWwubWFrZS5zcHJpdGUoMCwgLTEwLCB0YWJsZSk7XG5cdFx0dGhpcy53aW5kb3cuYW5jaG9yLnNldCgwLjUsIDEpO1xuXHRcdHRoaXMud2luZG93LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy53aW5kb3cuYWxwaGEgPSAwO1xuXHRcdHRoaXMuc3ByaXRlLmFkZENoaWxkKHRoaXMud2luZG93KTtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cblx0XHR0aGlzLndpbmRvdy5hbHBoYSA9IDA7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnBsYXllci5zcHJpdGUsIChfLCBwbCkgPT4ge1xuXHRcdFx0dGhpcy53aW5kb3cuYWxwaGEgPSAxO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGVhdGg7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuL0VudGl0eScpO1xuXG5jbGFzcyBFbmVteSBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5LCB0eXBlID0gJ2VuZW15Jykge1xuXHRcdHN1cGVyKGxldmVsLCB4LCB5LCB0eXBlKTtcblx0XHRpZiAodGhpcy53ZWFwb24pIHRoaXMud2VhcG9uLndlYXBvbi5maXJlUmF0ZSA9IDMwMDtcblx0XHR0aGlzLmRpciA9IDE7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdHRoaXMubGV2ZWwuZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKTtcblx0XHR0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0TWF0aC5yYW5kb20oKSA8IDAuNSAmJiB0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLmRlYWQoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKF8sIHBsKSA9PiBwbC5jbGFzcy5kZWFkKCkpO1xuXG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLmxldmVsLm1haW5IZXJvLnBvc2l0aW9uO1xuXHRcdGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Y29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdGNvbnN0IHJpZ2h0Qm90dG9tVGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblx0XHRjb25zdCBsZWZ0Qm90dG9tVGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblxuXHRcdGlmIChyaWdodFRpbGUgfHwgIXJpZ2h0Qm90dG9tVGlsZSkgdGhpcy5kaXIgPSAtMTtcblx0XHRpZiAobGVmdFRpbGUgfHwgIWxlZnRCb3R0b21UaWxlKSB0aGlzLmRpciA9IDE7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gODAgKiB0aGlzLmRpcjtcblx0XHR0aGlzLnNwcml0ZS5zY2FsZS54ID0gdGhpcy5kaXIgKiAtMTtcblxuXHRcdC8vIGVsc2UgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSAwO1xuXG5cdFx0Ly8gdGhpcy53ZWFwb24udXBkYXRlKHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZVRvWFkodGhpcy53ZWFwb24uc3ByaXRlLCB4LCB5KSk7XG5cblx0XHQvLyBpZiAodGhpcy5nYW1lLm1hdGguZGlzdGFuY2UoeCwgeSwgdGhpcy5zcHJpdGUueCwgdGhpcy5zcHJpdGUueSkgPCAxNTApIHtcblx0XHQvLyBcdCF0aGlzLmlzRGVhZCAmJiB0aGlzLndlYXBvbi5maXJlKCk7XG5cdFx0Ly8gfVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW5lbXk7XG4iLCJjb25zdCBXZWFwb24gPSByZXF1aXJlKCcuL1dlYXBvbi5qcycpO1xuY29uc3QgZW50aXRpZXMgPSByZXF1aXJlKCcuL2VudGl0aWVzLmpzb24nKTtcblxuY2xhc3MgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUsIGlzV2VhcG9uID0gdHJ1ZSkge1xuXHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0dGhpcy5sZXZlbCA9IGxldmVsO1xuXHRcdHRoaXMuZ2FtZSA9IGxldmVsLmdhbWU7XG5cdFx0dGhpcy5fZW50aXR5ID0gZW50aXRpZXNbdHlwZV07XG5cblx0XHR0aGlzLnggPSB4IHx8IDA7XG5cdFx0dGhpcy55ID0geSB8fCAwO1xuXHRcdHRoaXMuc3BlZWQgPSB0aGlzLl9lbnRpdHkuc3BlZWQgfHwgMTAwO1xuXHRcdHRoaXMuaHAgPSB0aGlzLl9lbnRpdHkuaHAgfHwgMTtcblx0XHR0aGlzLnJhZGl1c1Zpc2liaWxpdHkgPSAxMDA7XG5cdFx0dGhpcy5pc0p1bXBpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmlzRGVhZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy53ZWFwb25JZCA9IHRoaXMuX2VudGl0eS53ZWFwb24gIT0gbnVsbCA/IHRoaXMuX2VudGl0eS53ZWFwb24gOiAnZ3VuJztcblx0XHR0aGlzLl9jcmVhdGVQaGFzZXJPYmplY3RzKCk7XG5cdH1cblxuXHRfY3JlYXRlUGhhc2VyT2JqZWN0cygpIHtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh0aGlzLngsIHRoaXMueSwgdGhpcy5fZW50aXR5LnRleHR1cmUpO1xuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblxuXHRcdGlmICh0aGlzLl9lbnRpdHkud2VhcG9uKSB0aGlzLndlYXBvbiA9IG5ldyBXZWFwb24odGhpcywgdGhpcy53ZWFwb25JZCk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5ncmF2aXR5LnkgPSAxMDAwO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkuZHJhZy5zZXQoMTUwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5Lm1heFZlbG9jaXR5LnNldCgxMDAwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LndpZHRoID0gMTY7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5oZWlnaHQgPSAxNjtcblx0XHR0aGlzLnNwcml0ZS5zeW5jQm91bmRzID0gdHJ1ZTtcblx0fVxuXG5cdF91cGRhdGUoKSB7XG5cdFx0aWYgKHRoaXMuaXNEZWFkKSByZXR1cm47XG5cblx0XHQvLyBjb2xsaXNpb24gcGVyc29uIHdpdGggYnVsbGV0c1xuXHRcdGxldCBidWxsZXRzID0gdGhpcy5sZXZlbC5idWxsZXRzLmNoaWxkcmVuO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYnVsbGV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09IGJ1bGxldHNbaV0udHlwZU93bmVyIHx8XG5cdFx0XHRcdCh0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTbGF2ZScgJiYgYnVsbGV0c1tpXS50eXBlT3duZXIgPT09ICdQbGF5ZXInKVxuXHRcdFx0KVxuXHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKGJ1bGxldHNbaV0sIHRoaXMuc3ByaXRlLCAocGVyc29uLCBidWxsZXQpID0+IHtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ICs9IE1hdGguY29zKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgKz0gTWF0aC5zaW4odGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuaHAtLTtcblx0XHRcdFx0aWYgKHRoaXMuaHAgPT09IDApIHRoaXMuZGVhZChidWxsZXQucm90YXRpb24pO1xuXHRcdFx0XHRidWxsZXQua2lsbCgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gZXh0ZW5kcyB1cGRhdGUhXG5cdFx0dGhpcy51cGRhdGUgJiYgdGhpcy51cGRhdGUoKTtcblx0fVxuXG5cdGRlYWQocm90YXRpb24pIHtcblx0XHR0aGlzLmlzRGVhZCA9IHRydWU7XG5cdFx0dGhpcy5vbkRlYWQgJiYgdGhpcy5vbkRlYWQocm90YXRpb24pO1xuXHRcdHRoaXMuc3ByaXRlLmtpbGwoKTtcblx0XHRpZiAodGhpcy53ZWFwb24pIHtcblx0XHRcdHRoaXMud2VhcG9uLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR0aGlzLndlYXBvbi53ZWFwb24uZGVzdHJveSgpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcbiIsImNsYXNzIEZpcmUge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSA9ICdmaXJlJykge1xuXHRcdHRoaXMuaHAgPSAxO1xuXHRcdHRoaXMubGV2ZWwgPSBsZXZlbDtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh4LCB5LCAnZmlyZV9ibHVlJywgMSk7XG5cdFx0Y29uc3QgYW5pbSA9IHRoaXMuc3ByaXRlLmFuaW1hdGlvbnMuYWRkKCdkZWZhdWx0Jyk7XG5cdFx0YW5pbS5wbGF5KDEwLCB0cnVlKTtcblxuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMSwgMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHBsLmNsYXNzLmRlYWQoKSk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaXJlO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcblxuY2xhc3MgRmx5IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHkpIHtcblx0XHRzdXBlcihsZXZlbCwgeCwgeSwgTWF0aC5yYW5kb20oKSA8IDAuNSA/ICdnbHV6JyA6ICdjaGlyaXBha2hhJyk7XG5cdFx0dGhpcy5zdGFydCA9IFt4LCB5XTtcblx0XHR0aGlzLmF0dGFja01vZGUgPSB0cnVlO1xuXHRcdHRoaXMudGltZXIgPSAwO1xuXHR9XG5cblx0b25EZWFkKHJvdGF0aW9uKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnNwcml0ZS5wb3NpdGlvbjtcblx0XHR0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0dGhpcy5sZXZlbC5kcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pO1xuXHRcdHRoaXMubGV2ZWwuZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKTtcblx0XHQvL2NvbnNvbGUubG9nKCdERUFEIScpO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dGFyZ2V0RW5lbXkoeCwgeSkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMubGV2ZWwuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRjb25zdCBzbGF2ZSA9IHNsYXZlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzbGF2ZXMubGVuZ3RoKV07XG5cdFx0dGhpcy50cmFjayA9IHNsYXZlID8gc2xhdmUuc3ByaXRlIDogdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdGlmICghdGhpcy50cmFjayB8fCB0aGlzLnRyYWNrLmNsYXNzLmlzRGVhZCkgcmV0dXJuIHRoaXMudGFyZ2V0RW5lbXkoKTtcblx0XHRpZiAodGhpcy5sZXZlbC5nYW1lLm1hdGguZGlzdGFuY2UodGhpcy50cmFjay54LCB0aGlzLnRyYWNrLnksIHRoaXMuc3ByaXRlLngsIHRoaXMuc3ByaXRlLnkpID4gMzAwKSB7XG5cdFx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi54ID0gdGhpcy5zdGFydFswXTtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnkgPSB0aGlzLnN0YXJ0WzFdO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRpbWVyID4gMTAwKSB7XG5cdFx0XHR0aGlzLnRpbWVyID0gMDtcblx0XHRcdHRoaXMuYXR0YWNrTW9kZSA9IHRydWU7XG5cdFx0fSBlbHNlIHRoaXMudGltZXIrKztcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5lbmVtaWVzLCAoXywgZW4pID0+IHtcblx0XHRcdGlmIChlbi5jbGFzcy50eXBlID09PSAnc2xhdmUnKSB7XG5cdFx0XHRcdGVuLmNsYXNzLmRlYWQoKTtcblx0XHRcdFx0dGhpcy5hdHRhY2tNb2RlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKF8sIHBsKSA9PiBwbC5jbGFzcy5kZWFkKCkpO1xuXHRcdGNvbnN0IGFuZ2xlID0gdGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5tb3ZlVG9YWShcblx0XHRcdHRoaXMuc3ByaXRlLFxuXHRcdFx0dGhpcy50cmFjay54LFxuXHRcdFx0dGhpcy50cmFjay55IC0gKHRoaXMuYXR0YWNrTW9kZSA/IDAgOiAxMjApLFxuXHRcdFx0dGhpcy5zcGVlZFxuXHRcdCk7XG5cblx0XHQvLyBidWxsZXRzXG5cdFx0bGV0IGJ1bGxldHMgPSB0aGlzLmxldmVsLmJ1bGxldHMuY2hpbGRyZW47XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBidWxsZXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuY29uc3RydWN0b3IubmFtZSA9PT0gYnVsbGV0c1tpXS50eXBlT3duZXIgfHxcblx0XHRcdFx0KHRoaXMuY29uc3RydWN0b3IubmFtZSA9PT0gJ1NsYXZlJyAmJiBidWxsZXRzW2ldLnR5cGVPd25lciA9PT0gJ1BsYXllcicpXG5cdFx0XHQpXG5cdFx0XHRcdGNvbnRpbnVlO1xuXG5cdFx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAoYnVsbGV0c1tpXSwgdGhpcy5zcHJpdGUsIChwZXJzb24sIGJ1bGxldCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggKz0gTWF0aC5jb3ModGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSArPSBNYXRoLnNpbih0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDtcblx0XHRcdFx0dGhpcy5kZWFkKGJ1bGxldC5yb3RhdGlvbik7XG5cdFx0XHRcdGJ1bGxldC5raWxsKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBjb25zdCByaWdodFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54ICsgMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdC8vIGNvbnN0IGxlZnRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55KTtcblx0XHQvLyBpZiAocmlnaHRUaWxlKSB0aGlzLmRpciA9IC0xO1xuXHRcdC8vIGlmIChsZWZ0VGlsZSkgdGhpcy5kaXIgPSAxO1xuXHRcdC8vIHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IDgwICogdGhpcy5kaXI7XG5cdFx0Ly8gdGhpcy5zcHJpdGUuc2NhbGUueCA9IHRoaXMuZGlyICogLTE7XG5cblx0XHQvLyBlbHNlIHRoaXMuYm9keS52ZWxvY2l0eS54ID0gMDtcblxuXHRcdC8vIHRoaXMud2VhcG9uLnVwZGF0ZSh0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuYW5nbGVUb1hZKHRoaXMud2VhcG9uLnNwcml0ZSwgeCwgeSkpO1xuXG5cdFx0Ly8gaWYgKHRoaXMuZ2FtZS5tYXRoLmRpc3RhbmNlKHgsIHksIHRoaXMuc3ByaXRlLngsIHRoaXMuc3ByaXRlLnkpIDwgMTUwKSB7XG5cdFx0Ly8gXHQhdGhpcy5pc0RlYWQgJiYgdGhpcy53ZWFwb24uZmlyZSgpO1xuXHRcdC8vIH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZseTtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4vRW50aXR5LmpzJyk7XG5jb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSScpO1xuXG5jbGFzcyBQbGF5ZXIgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSkge1xuXHRcdHN1cGVyKGxldmVsLCB4LCB5LCAncGxheWVyJyk7XG5cdFx0dGhpcy5vcmdhbnMgPSBbXTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHRpZiAodGhpcy5zcHJpdGUueSA+IDMwMCkge1xuXHRcdFx0dGhpcy5kZWFkKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cblx0XHR0aGlzLnNwcml0ZS5zY2FsZS54ID0gdGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54IDwgMCA/IC0xIDogMTtcblx0XHRjb25zdCBhbmdsZSA9IHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZVRvUG9pbnRlcih0aGlzLndlYXBvbi5zcHJpdGUpO1xuXHRcdGlmIChhbmdsZSA8IC0xLjggfHwgYW5nbGUgPiAxLjQpIHRoaXMuc3ByaXRlLnNjYWxlLnggPSAtMTtcblx0XHRlbHNlIHRoaXMuc3ByaXRlLnNjYWxlLnggPSAxO1xuXG5cdFx0dGhpcy53ZWFwb24udXBkYXRlKGFuZ2xlKTtcblxuXHRcdC8vIEl0ZW1zIHVzZVxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5pdGVtcywgKHNwcml0ZSwgaXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5raWxsKCk7XG5cdFx0XHR0aGlzLm9yZ2Fucy5wdXNoKGl0ZW0udHlwZSk7XG5cdFx0XHRVSS5vcmdhbnMrKztcblx0XHRcdHRoaXMubGV2ZWwuYWRkU2xhdmUodGhpcy5zcHJpdGUucG9zaXRpb24ueCwgdGhpcy5zcHJpdGUucG9zaXRpb24ueSk7XG5cdFx0fSk7XG5cdH1cblxuXHRvbldvdW5kZWQoKSB7fVxuXG5cdG9uRGVhZCgpIHtcblx0XHRVSS5pc0RlYWQgPSB0cnVlO1xuXHRcdHRoaXMubGV2ZWwucmVzdHJ1Y3RTbGF2ZXMoKTtcblx0XHR0aGlzLmxldmVsLnN0YXRlLnN0YXJ0KCdIb21lJyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuL0VudGl0eS5qcycpO1xuXG5jbGFzcyBTbGF2ZSBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5LCBpbmRleCwgbGltaXQpIHtcblx0XHRzdXBlcihsZXZlbCwgeCwgeSwgJ3NsYXZlJywgZmFsc2UpO1xuXHRcdHRoaXMuaW5kZXggPSBpbmRleDtcblx0XHR0aGlzLmxpbWl0ID0gbGltaXQ7XG5cdFx0dGhpcy5zdG9wTW92ZSA9IGZhbHNlO1xuXHRcdHRoaXMubm90QWN0aXZlID0gZmFsc2U7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0aWYgKHRoaXMuc3ByaXRlLmlzTWFpbkhlcm8pIHRoaXMubm90QWN0aXZlID0gdHJ1ZTtcblx0XHRpZiAodGhpcy5ub3RBY3RpdmUpIHtcblx0XHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMubm90QWN0aXZlID0gZmFsc2U7XG5cdFx0XHRcdHRoaXMuaW5kZXggPSB0aGlzLmxldmVsLmNvbnRyb2xzLmxlbmd0aCAtIHRoaXMubGltaXQ7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuc29saWRzKTtcblx0XHRpZiAodGhpcy5ub3RBY3RpdmUgfHwgdGhpcy5zcHJpdGUuaXNNYWluSGVybyB8fCAhdGhpcy5sZXZlbC5pc1BsYXllck1haW4pIHJldHVybjtcblxuXHRcdC8vIGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5sZXZlbC5tYWluSGVyby5wb3NpdGlvbjtcblx0XHQvLyBjb25zdCB2ZWxYID0gdGhpcy5sZXZlbC5tYWluSGVyby5ib2R5LnZlbG9jaXR5Lng7XG5cdFx0Ly9pZiAoIXZlbFgpIHJldHVybjtcblxuXHRcdGNvbnN0IFt4LCB5LCBpc0dyb3VkXSA9IHRoaXMubGV2ZWwuY29udHJvbHNbdGhpcy5pbmRleF07XG5cdFx0aWYgKCF0aGlzLnN0b3BNb3ZlKSB7XG5cdFx0XHR0aGlzLnNwcml0ZS5zY2FsZS54ID0geCAtIHRoaXMuc3ByaXRlLnBvc2l0aW9uLnggPCAwID8gLTEgOiAxO1xuXHRcdFx0dGhpcy5zcHJpdGUucG9zaXRpb24ueCA9IHg7XG5cdFx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi55ID0geTtcblx0XHR9XG5cblx0XHRpZiAoIWlzR3JvdWQgfHwgdGhpcy5pbmRleCA8IHRoaXMubGV2ZWwuY29udHJvbHMubGVuZ3RoIC0gdGhpcy5saW1pdCkge1xuXHRcdFx0aWYgKHRoaXMuaW5kZXggPCB0aGlzLmxldmVsLmNvbnRyb2xzLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0dGhpcy5pbmRleCsrO1xuXHRcdFx0XHR0aGlzLnN0b3BNb3ZlID0gZmFsc2U7XG5cdFx0XHR9IGVsc2UgdGhpcy5zdG9wTW92ZSA9IHRydWU7XG5cdFx0fSBlbHNlIHRoaXMuc3RvcE1vdmUgPSB0cnVlO1xuXG5cdFx0Ly8gY29uc3QgcmlnaHRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCArIDE2LCB0aGlzLnNwcml0ZS55KSB8fCB7fTtcblx0XHQvLyBjb25zdCBsZWZ0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSkgfHwge307XG5cdFx0Ly8gY29uc3QgZG93bkxlZnRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCArIDE2LCB0aGlzLnNwcml0ZS55ICsgMTYpO1xuXHRcdC8vIGNvbnN0IGRvd25SaWdodFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkgKyAxNik7XG5cblx0XHQvLyBpZiAodGhpcy5zcHJpdGUuYm9keS5vbkZsb29yKCkpIHtcblx0XHQvLyBcdGlmICghZG93bkxlZnRUaWxlIHx8IGxlZnRUaWxlLmNhbkNvbGxpZGUpIHtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ID0gLTQwMDtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gLTE1MDtcblx0XHQvLyBcdH1cblx0XHQvLyBcdGlmICghZG93blJpZ2h0VGlsZSB8fCByaWdodFRpbGUuY2FuQ29sbGlkZSkge1xuXHRcdC8vIFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgPSAtNDAwO1xuXHRcdC8vIFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPSAxNTA7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gfVxuXG5cdFx0Ly8gdGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gdmVsWDtcblxuXHRcdC8vIGlmICh0aGlzLmp1bXBCdXR0b24uaXNEb3duICYmIHRoaXMuc3ByaXRlLmJvZHkub25GbG9vcigpICYmIHRoaXMuZ2FtZS50aW1lLm5vdyA+IHRoaXMuanVtcFRpbWVyKSB7XG5cdFx0Ly8gXHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgPSAtMTAwMDtcblx0XHQvLyBcdHRoaXMuanVtcFRpbWVyID0gdGhpcy5nYW1lLnRpbWUubm93ICsgNTAwO1xuXHRcdC8vIH1cblx0fVxuXG5cdG9uRGVhZCgpIHtcblx0XHRpZiAodGhpcy5zcHJpdGUuaXNNYWluSGVybykgdGhpcy5sZXZlbC5zd2FwSGVybyh0cnVlKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNsYXZlO1xuIiwiY29uc3Qgd2VhcG9ucyA9IHJlcXVpcmUoJy4vd2VhcG9ucy5qc29uJyk7XG5cbmNsYXNzIFdlYXBvbiB7XG5cdGNvbnN0cnVjdG9yKHBlcnNvbiwgdHlwZSkge1xuXHRcdHRoaXMubGV2ZWwgPSBwZXJzb24ubGV2ZWw7XG5cdFx0dGhpcy5nYW1lID0gdGhpcy5sZXZlbC5nYW1lO1xuXHRcdHRoaXMucGVyc29uID0gcGVyc29uO1xuXG5cdFx0dGhpcy5zcHJpdGUgPSB0aGlzLmxldmVsLmFkZC5zcHJpdGUoMCwgMCwgJ2d1bicpO1xuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5fd2VhcG9ucyA9IHdlYXBvbnNbdHlwZV07XG5cdFx0dGhpcy5pZCA9IHRoaXMuX3dlYXBvbnMuaWQgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMuaWQgOiAwO1xuXHRcdHRoaXMudHJhY2tYID0gdGhpcy5fd2VhcG9ucy50cmFja1ggIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMudHJhY2tYIDogMTY7XG5cdFx0dGhpcy50cmFja1kgPSB0aGlzLl93ZWFwb25zLnRyYWNrWSAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy50cmFja1kgOiA0O1xuXHRcdHRoaXMuc3BlZWQgPSB0aGlzLl93ZWFwb25zLnNwZWVkICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLnNwZWVkIDogMTAwO1xuXHRcdHRoaXMuZGFtYWdlID0gdGhpcy5fd2VhcG9ucy5kYW1hZ2UgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMuZGFtYWdlIDogMTtcblx0XHR0aGlzLmRlbGF5ID0gdGhpcy5fd2VhcG9ucy5kZWxheSAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5kZWxheSA6IDEwO1xuXHRcdHRoaXMucXVhbnRpdHkgPSB0aGlzLl93ZWFwb25zLnF1YW50aXR5ICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLnF1YW50aXR5IDogMTtcblxuXHRcdHRoaXMud2VhcG9uID0gdGhpcy5sZXZlbC5hZGQud2VhcG9uKDEwMCwgJ2J1bGxldCcsIG51bGwsIHRoaXMubGV2ZWwuYnVsbGV0cyk7XG5cdFx0dGhpcy53ZWFwb24uc2V0QnVsbGV0RnJhbWVzKHRoaXMuaWQsIHRoaXMuaWQsIHRydWUpO1xuXHRcdHRoaXMud2VhcG9uLmJ1bGxldEtpbGxUeXBlID0gUGhhc2VyLldlYXBvbi5LSUxMX1dPUkxEX0JPVU5EUztcblx0XHR0aGlzLndlYXBvbi5idWxsZXRTcGVlZCA9IHRoaXMuc3BlZWQ7XG5cdFx0dGhpcy53ZWFwb24uZmlyZVJhdGUgPSB0aGlzLmRlbGF5O1xuXHRcdHRoaXMud2VhcG9uLmJ1bGxldHMudHlwZU93bmVyID0gdGhpcy5wZXJzb24uY29uc3RydWN0b3IubmFtZTtcblxuXHRcdHRoaXMud2VhcG9uLnRyYWNrU3ByaXRlKHRoaXMucGVyc29uLnNwcml0ZSk7XG5cdH1cblxuXHR1cGRhdGVUcmFjayh4LCB5KSB7XG5cdFx0dGhpcy5zcHJpdGUuYW5nbGUgPSB0aGlzLmxldmVsLmdhbWUuYW5nbGVCZXR3ZWVuKHRoaXMuc3ByaXRlKTtcblx0fVxuXG5cdGZpcmUoeCwgeSkge1xuXHRcdGxldCBidWxsZXQgPSB0aGlzLndlYXBvbi5maXJlKCk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdFx0Ly8gaWYgKGJ1bGxldCkge1xuXHRcdC8vIFx0dGhpcy5wZXJzb24uc3ByaXRlLmJvZHkudmVsb2NpdHkueCAtPSBNYXRoLmNvcyh0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDA7XG5cdFx0Ly8gXHR0aGlzLnBlcnNvbi5zcHJpdGUuYm9keS52ZWxvY2l0eS55IC09IE1hdGguc2luKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwMDtcblx0XHQvLyBcdHJldHVybiB0cnVlO1xuXHRcdC8vIH1cblx0fVxuXHR1cGRhdGUoYW5nbGUpIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMucGVyc29uLnNwcml0ZS5wb3NpdGlvbjtcblx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi5zZXQoeCwgeSArIDMpO1xuXHRcdHRoaXMuc3ByaXRlLnJvdGF0aW9uID0gYW5nbGU7XG5cdFx0dGhpcy53ZWFwb24uZmlyZUFuZ2xlID0gdGhpcy5nYW1lLm1hdGgucmFkVG9EZWcoYW5nbGUpO1xuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMud2VhcG9uLmJ1bGxldHMsIHRoaXMubGV2ZWwuc29saWRzLCAoYnVsbGV0LCB0aWxlKSA9PiB7XG5cdFx0XHRidWxsZXQua2lsbCgpO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2VhcG9uO1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuXHRcInBsYXllclwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwicGxheWVyXCIsXG5cdFx0XCJqdW1wXCI6IDMsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJocFwiOiAxLFxuXHRcdFwid2VhcG9uXCI6IFwiZ3VuXCJcblx0fSxcblx0XCJzbGF2ZVwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwiem9tYmlcIixcblx0XHRcImp1bXBcIjogMyxcblx0XHRcInNwZWVkXCI6IDEwMCxcblx0XHRcImhwXCI6IDEsXG5cdFx0XCJ3ZWFwb25cIjogXCJcIlxuXHR9LFxuXHRcImVuZW15XCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJkZW1vblwiLFxuXHRcdFwianVtcFwiOiAzLFxuXHRcdFwic3BlZWRcIjogMTAwLFxuXHRcdFwiaHBcIjogMSxcblx0XHRcInJhZGl1c1Zpc2liaWxpdHlcIjogMTUwLFxuXHRcdFwid2VhcG9uXCI6IFwiXCJcblx0fSxcblx0XCJnbHV6XCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJnbHV6XCIsXG5cdFx0XCJzcGVlZFwiOiA3MCxcblx0XHRcImhwXCI6IDIsXG5cdFx0XCJ3ZWFwb25cIjogXCJcIlxuXHR9LFxuXHRcImNoaXJpcGFraGFcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcImNoaXJpcGFraGFcIixcblx0XHRcInNwZWVkXCI6IDEwMCxcblx0XHRcImhwXCI6IDEsXG5cdFx0XCJ3ZWFwb25cIjogXCJcIlxuXHR9XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XG5cdFwiZ3VuXCI6IHtcblx0XHRcImlkXCI6IDEsXG5cdFx0XCJyYW5nZVwiOiAxMDAsXG5cdFx0XCJzcGVlZFwiOiA0MDAsXG5cdFx0XCJkYW1hZ2VcIjogMTAsXG5cdFx0XCJkZWxheVwiOiA0MDAsXG5cdFx0XCJxdWFudGl0eVwiOiAxMCxcblx0XHRcInRyYWNrWFwiOiAxLFxuXHRcdFwidHJhY2tZXCI6IDFcblx0fVxufVxuIiwiY29uc3QgQm9vdCA9IHJlcXVpcmUoJy4vc3RhdGVzL0Jvb3QuanMnKTtcbmNvbnN0IFByZWxvYWQgPSByZXF1aXJlKCcuL3N0YXRlcy9QcmVsb2FkLmpzJyk7XG5jb25zdCBNZW51ID0gcmVxdWlyZSgnLi9zdGF0ZXMvTWVudS5qcycpO1xuY29uc3QgTGV2ZWwgPSByZXF1aXJlKCcuL3N0YXRlcy9MZXZlbC5qcycpO1xuY29uc3QgSG9tZSA9IHJlcXVpcmUoJy4vc3RhdGVzL0hvbWUuanMnKTtcblxudmFyIHJlYWR5ID0gKCkgPT4ge1xuXHR2YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg0ODAsIDE0ICogMTYsIFBoYXNlci5BVVRPLCAnU2hvb3RlckJsaW5rJyk7XG5cblx0Z2FtZS5zdGF0ZS5hZGQoJ01lbnUnLCBNZW51KTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ0hvbWUnLCBIb21lKTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ0xldmVsJywgTGV2ZWwpO1xuXHRnYW1lLnN0YXRlLmFkZCgnUHJlbG9hZCcsIFByZWxvYWQpO1xuXHRnYW1lLnN0YXRlLmFkZCgnQm9vdCcsIEJvb3QsIHRydWUpO1xufTtcblxucmVhZHkoKTtcbiIsInZhciBVSSA9IHtcblx0bGV2ZWw6IDEsXG5cdGJ1bGxldHM6IDEwLFxuXHRvcmdhbnM6IDAsXG5cdGlzRGVhZDogdHJ1ZSxcblxuXHRhZGRUZXh0QnV0dG9uOiAoeCA9IDAsIHkgPSAwLCB0ZXh0LCB0ZXh0RmFtaWx5LCBmb250U2l6ZSA9IDMwLCBjYikgPT4ge1xuXHRcdGxldCB0eHQgPSBVSS5hZGRUZXh0KHgsIHksIHRleHQsIHRleHRGYW1pbHksIGZvbnRTaXplKTtcblx0XHRVSS5zZXRCdXR0b24odHh0LCBjYik7XG5cdFx0cmV0dXJuIHR4dDtcblx0fSxcblxuXHRhZGRUZXh0OiAoeCA9IDAsIHkgPSAwLCB0ZXh0LCB0ZXh0RmFtaWx5LCBmb250U2l6ZSA9IDMwLCBmaWxsID0gJyNmZmYnKSA9PiB7XG5cdFx0bGV0IHR4dCA9IFVJLmdhbWUuYWRkLnRleHQoeCwgeSwgdGV4dCwgeyB0ZXh0RmFtaWx5LCBmb250U2l6ZSwgZmlsbCB9KTtcblx0XHR0eHQuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0eHQuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHJldHVybiB0eHQ7XG5cdH0sXG5cblx0YWRkSWNvbkJ1dHRvbjogKHggPSAwLCB5ID0gMCwga2V5LCBpbmRleCwgY2IpID0+IHtcblx0XHRsZXQgc3ByaXRlID0gVUkuZ2FtZS5hZGQuc3ByaXRlKHgsIHksIGtleSwgaW5kZXgpO1xuXHRcdHNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHNwcml0ZS5zY2FsZS5zZXQoMS41KTtcblx0XHRVSS5zZXRCdXR0b24oc3ByaXRlLCBjYik7XG5cdFx0cmV0dXJuIHNwcml0ZTtcblx0fSxcblxuXHRzZXRCdXR0b246IChvYmosIGNiKSA9PiB7XG5cdFx0b2JqLmlucHV0RW5hYmxlZCA9IHRydWU7XG5cdFx0bGV0IHggPSBvYmouc2NhbGUueDtcblx0XHRsZXQgeSA9IG9iai5zY2FsZS55O1xuXG5cdFx0b2JqLmV2ZW50cy5vbklucHV0RG93bi5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKG9iai5kaXNhYmxlKSByZXR1cm47XG5cdFx0XHRVSS5nYW1lLmFkZFxuXHRcdFx0XHQudHdlZW4ob2JqLnNjYWxlKVxuXHRcdFx0XHQudG8oeyB4OiB4ICsgMC4zLCB5OiB5ICsgMC4zIH0sIDMwMClcblx0XHRcdFx0LnN0YXJ0KCk7XG5cdFx0fSk7XG5cdFx0b2JqLmV2ZW50cy5vbklucHV0VXAuYWRkKCgpID0+IHtcblx0XHRcdGlmIChvYmouZGlzYWJsZSkgcmV0dXJuO1xuXHRcdFx0Y2IoKTtcblx0XHR9KTtcblx0XHRvYmouZXZlbnRzLm9uSW5wdXRPdmVyLmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdFVJLmdhbWUuYWRkXG5cdFx0XHRcdC50d2VlbihvYmouc2NhbGUpXG5cdFx0XHRcdC50byh7IHg6IHggKyAwLjMsIHk6IHkgKyAwLjMgfSwgMzAwKVxuXHRcdFx0XHQuc3RhcnQoKTtcblx0XHR9KTtcblx0XHRvYmouZXZlbnRzLm9uSW5wdXRPdXQuYWRkKCgpID0+IHtcblx0XHRcdGlmIChvYmouZGlzYWJsZSkgcmV0dXJuO1xuXHRcdFx0VUkuZ2FtZS5hZGRcblx0XHRcdFx0LnR3ZWVuKG9iai5zY2FsZSlcblx0XHRcdFx0LnRvKHsgeDogeCwgeTogeSB9LCAzMDApXG5cdFx0XHRcdC5zdGFydCgpO1xuXHRcdH0pO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJO1xuIiwiY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUknKTtcblxuY2xhc3MgQm9vdCB7XG5cdGluaXQoKSB7XG5cdFx0dGhpcy53ID0gNDgwO1xuXHRcdHRoaXMuaCA9IDE1ICogMTY7XG5cdFx0VUkuZ2FtZSA9IHRoaXMuZ2FtZTtcblx0fVxuXG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLnNjYWxlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XG5cdFx0dGhpcy5zY2FsZS5mdWxsU2NyZWVuU2NhbGVNb2RlID0gUGhhc2VyLlNjYWxlTWFuYWdlci5FWEFDVF9GSVQ7XG5cdFx0dGhpcy5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlO1xuXHRcdHRoaXMuc2NhbGUucGFnZUFsaWduVmVydGljYWxseSA9IHRydWU7XG5cdFx0dGhpcy5zY2FsZS5zZXRNYXhpbXVtKCk7XG5cblx0XHR0aGlzLmdhbWUucmVuZGVyZXIucmVuZGVyU2Vzc2lvbi5yb3VuZFBpeGVscyA9IHRydWU7XG5cdFx0UGhhc2VyLkNhbnZhcy5zZXRJbWFnZVJlbmRlcmluZ0NyaXNwKHRoaXMuZ2FtZS5jYW52YXMpO1xuXG5cdFx0dGhpcy5zdGF0ZS5zdGFydCgnUHJlbG9hZCcpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm9vdDtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJLmpzJyk7XG5cbmNvbnN0IExJVkVSID0gJ3BlY2hlbic7XG5jb25zdCBIRUFSVCA9ICdzZXJkZWNoa28nO1xuY29uc3QgU1RPTUFDSCA9ICd6aGVsdWRvayc7XG5jb25zdCBCUkFJTiA9ICdtb3pnJztcblxuY2xhc3MgSG9tZSB7XG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCA0ODAsIDMyMCk7XG5cdFx0dGhpcy5zY3JlZW4gPSB0aGlzLmFkZC5zcHJpdGUoMCwgMCwgJ3NjcmVlbicpO1xuXHRcdHRoaXMuc2NyZWVuLnNjYWxlLnNldCgyKTtcblx0XHR0aGlzLnNjcmVlbi5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc2NyZWVuLmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnNjcmVlbi54ID0gNDgwIC8gMjtcblx0XHR0aGlzLnNjcmVlbi55ID0gMjQwIC8gMjtcblxuXHRcdHRoaXMucGF0cnkgPSB0aGlzLmFkZC5zcHJpdGUoMCwgMCwgJ3BhdHJ5Jyk7XG5cdFx0dGhpcy5wYXRyeS5zY2FsZS5zZXQoMik7XG5cdFx0dGhpcy5wYXRyeS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMucGF0cnkuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMucGF0cnkueCA9IDQ4MCAvIDIgLSA4MDtcblx0XHR0aGlzLnBhdHJ5LnkgPSAyNDAgLyAyO1xuXG5cdFx0dGhpcy5wYXkgPSB0aGlzLmFkZC5zcHJpdGUoMCwgMCwgJ3BheScpO1xuXHRcdHRoaXMucGF5LnNjYWxlLnNldCgyKTtcblx0XHR0aGlzLnBheS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMucGF5LmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnBheS54ID0gNDgwIC8gMiArIDgwO1xuXHRcdHRoaXMucGF5LnkgPSAyNDAgLyAyO1xuXHRcdHRoaXMucGF5LmlucHV0RW5hYmxlZCA9IHRydWU7XG5cdFx0dGhpcy5wYXkuZXZlbnRzLm9uSW5wdXRVcC5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKCFVSS5vcmdhbnMpIHJldHVybjtcblx0XHRcdFVJLm9yZ2FucyAtPSAxO1xuXHRcdFx0VUkuYnVsbGV0cyArPSAyO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5zdGFydCA9IHRoaXMuYWRkLnNwcml0ZSgwLCAwLCAnc3RhcnQnKTtcblx0XHR0aGlzLnN0YXJ0LnNjYWxlLnNldCgyKTtcblx0XHR0aGlzLnN0YXJ0LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zdGFydC5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5zdGFydC54ID0gNDgwIC8gMiArIDgwO1xuXHRcdHRoaXMuc3RhcnQueSA9IDI0MCAvIDIgKyA1MDtcblx0XHR0aGlzLnN0YXJ0LmlucHV0RW5hYmxlZCA9IHRydWU7XG5cdFx0dGhpcy5zdGFydC5ldmVudHMub25JbnB1dFVwLmFkZCgoKSA9PiB7XG5cdFx0XHR0aGlzLnN0YXRlLnN0YXJ0KCdMZXZlbCcpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbmV3cyA9IFsn0KXQsNC60LDRgtC+0L0g0L7RgiBEVEYhINCh0L7QsdC40YDQsNC50YLQtSDQutC+0LzQsNC90LTRgyEnXTtcblx0XHRjb25zdCB0ZXh0ID0gbmV3c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBuZXdzLmxlbmd0aCldO1xuXHRcdFVJLmFkZFRleHQoMTEwLCA0OCwgdGV4dCwgJ0FyaWFsJywgMTQsICcjMDAwJykuYW5jaG9yLnNldCgwLCAwKTtcblxuXHRcdC8vVUkuYWRkVGV4dCgxNDAsIDEyMCwgJ9Cc0LDQs9Cw0LfQuNC9JywgJ0FyaWFsJywgMTQsICcjMDAwJyk7XG5cblx0XHQvL1VJLmFkZFRleHQoMTEwLCAxNDAsICcyINC/0LDRgtGA0L7QvdGLID0gMSDQvtGA0LPQsNC9JywgJ0FyaWFsJywgMTQsICcjMDAwJykuYW5jaG9yLnNldCgwLCAwKTtcblx0XHQvLyBVSS5hZGRUZXh0QnV0dG9uKDMwMCwgMTQwLCAn0J7QsdC80LXQvdGP0YLRjCcsICdBcmlhbCcsIDE0LCAoKSA9PiB7XG5cdFx0Ly8gXHRpZiAoIVVJLm9yZ2FucykgcmV0dXJuO1xuXHRcdC8vIFx0VUkub3JnYW5zIC09IDE7XG5cdFx0Ly8gXHRVSS5idWxsZXRzICs9IDI7XG5cdFx0Ly8gfSkuYW5jaG9yLnNldCgwLCAwKTtcblxuXHRcdC8vIHRoaXMuYmcgPSB0aGlzLmFkZC50aWxlU3ByaXRlKDAsIDAsIHRoaXMud29ybGQud2lkdGgsIHRoaXMud29ybGQuaGVpZ2h0LCAnYmcnKTtcblxuXHRcdC8vIHRoaXMubGFiZWxQYXRoMSA9IFVJLmFkZFRleHQoMTYwLCA1MCwgJ2ZvbnQnLCAnQkxJTksnLCAzNSk7XG5cdFx0Ly8gdGhpcy5hZGQudHdlZW4odGhpcy5sYWJlbFBhdGgxKVxuXHRcdC8vIFx0LnRvKHthbHBoYTogMH0sIDIwMClcblx0XHQvLyBcdC50byh7YWxwaGE6IDF9LCAxMDApXG5cdFx0Ly8gXHQuc3RhcnQoKVxuXHRcdC8vIFx0Lmxvb3AoKTtcblxuXHRcdC8vIHRoaXMubGFiZWxQYXJ0MiA9IFVJLmFkZFRleHQoMzIwLCA1NSwgJ2ZvbnQnLCAnU0hPT1RFUicsIDI1KTtcblxuXHRcdC8vIHRoaXMuYnRuU3RhcnQgPSBVSS5hZGRUZXh0QnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZLTM1LCAnZm9udCcsICdTVEFSVCcsIDMwLCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdMZXZlbE1hbmFnZXInKTtcblx0XHQvLyB9KTtcblx0XHQvLyB0aGlzLmJ0blNldHRpbmdzID0gVUkuYWRkVGV4dEJ1dHRvbih0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWSsxMCwgJ2ZvbnQnLCAnU0VUVElOR1MnLCAzMCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnU2V0dGluZ3MnKTtcblx0XHQvLyB9KTtcblxuXHRcdC8vIHRoaXMuaW5mbyA9IFVJLmFkZFRleHQoMTAsIDUsICdmb250MicsICdQb3dlcmVkIGJ5IGF6YmFuZyBAdjAuMScsIDE0KTtcblx0XHQvLyB0aGlzLmluZm8uYW5jaG9yLnNldCgwKTtcblxuXHRcdC8vIFVJLmFkZFRleHRCdXR0b24oMzAwLCAyMjAsICfQndCQ0KfQkNCi0KwgPicsICdBcmlhbCcsIDE0LCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdMZXZlbCcpO1xuXHRcdC8vIH0pLmFuY2hvci5zZXQoMCwgMCk7XG5cblx0XHRsZXQgc3RhcnQgPSAxMDU7XG5cdFx0bGV0IHkgPSAxODA7XG5cdFx0Y29uc3QgbWluaXBhbHlhID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgMzAsIHksICdtaW5pcGFseWEnKTtcblx0XHRtaW5pcGFseWEuc2NhbGUuc2V0KDIpO1xuXHRcdG1pbmlwYWx5YS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaXBhbHlhLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmlwYWx5YS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgMzQsIHkgKyAzLCBVSS5idWxsZXRzLCAnQXJpYWwnLCAxNCwgJyMwMCcpO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cblx0XHRjb25zdCBtaW5pbW96ZyA9IHRoaXMuYWRkLnNwcml0ZShzdGFydCArIDkwLCB5LCAnbWluaW1vemcnKTtcblx0XHRtaW5pbW96Zy5zY2FsZS5zZXQoMik7XG5cdFx0bWluaW1vemcuYW5jaG9yLnNldCgwLjUpO1xuXHRcdG1pbmltb3pnLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmltb3pnLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5vcmdhbnNUZXh0ID0gVUkuYWRkVGV4dChzdGFydCArIDk0LCB5ICsgMywgMCwgJ0FyaWFsJywgMTQsICcjZmYwMDAwJyk7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMub3JnYW5zVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cdH1cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMuYnVsbGV0c1RleHQudGV4dCA9IFVJLmJ1bGxldHM7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LnRleHQgPSBVSS5vcmdhbnM7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb21lO1xuIiwiY29uc3QgUGxheWVyID0gcmVxdWlyZSgnLi4vZ2FtZS9QbGF5ZXInKTtcbmNvbnN0IEVuZW15ID0gcmVxdWlyZSgnLi4vZ2FtZS9FbmVteScpO1xuY29uc3QgU2xhdmUgPSByZXF1aXJlKCcuLi9nYW1lL1NsYXZlJyk7XG5jb25zdCBGaXJlID0gcmVxdWlyZSgnLi4vZ2FtZS9GaXJlJyk7XG5jb25zdCBGbHkgPSByZXF1aXJlKCcuLi9nYW1lL0ZseScpO1xuY29uc3QgRGVhdGggPSByZXF1aXJlKCcuLi9nYW1lL0RlYXRoJyk7XG5cbmNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNvbnN0IExJVkVSID0gJ3BlY2hlbic7XG5jb25zdCBIRUFSVCA9ICdzZXJkZWNoa28nO1xuY29uc3QgU1RPTUFDSCA9ICd6aGVsdWRvayc7XG5jb25zdCBCUkFJTiA9ICdtb3pnJztcblxuY2xhc3MgTGV2ZWwge1xuXHRjcmVhdGUoKSB7XG5cdFx0bGV0IGx2bCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMpICsgMTtcblx0XHRpZiAoVUkubm90Rmlyc3RMZXZlbCkge1xuXHRcdFx0Ly8g0KHQkNCc0JDQryDQotCj0J/QkNCvINCT0JXQndCV0KDQkNCm0JjQr1xuXHRcdFx0aWYgKFVJLmlzRGVhZCkge1xuXHRcdFx0XHRsdmwgPSAnaG9tZSc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR3aGlsZSAobHZsID09PSBVSS5sYXN0THZsKSB7XG5cdFx0XHRcdFx0bHZsID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykgKyAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFVJLmxhc3RMdmwgPSBsdmw7XG5cdFx0XHR9XG5cblx0XHRcdGx2bCA9IFVJLmlzRGVhZCA/IGx2bCA6ICdsZXZlbCcgKyBsdmw7XG5cdFx0XHRVSS5pc0RlYWQgPSBmYWxzZTtcblx0XHR9IGVsc2UgbHZsID0gJ2xldmVsMSc7XG5cdFx0VUkubm90Rmlyc3RMZXZlbCA9IHRydWU7XG5cblx0XHR0aGlzLm1hcCA9IHRoaXMuZ2FtZS5hZGQudGlsZW1hcChsdmwsIDE2LCAxNik7XG5cdFx0dGhpcy5tYXAuYWRkVGlsZXNldEltYWdlKCd0aWxlbWFwJyk7XG5cdFx0Ly9cdHRoaXMubWFwLmRlYnVnTWFwID0gdHJ1ZTtcblxuXHRcdC8vdGhpcy5nYW1lLmNhbWVyYS5ib3VuZHMgPSBudWxsO1xuXHRcdC8vdGhpcy5nYW1lLmNhbWVyYS5ib3VuZHMuc2V0VG8oLUluZmluaXR5LCAtSW5maW5pdHksIEluZmluaXR5LCBJbmZpbml0eSk7XG5cblx0XHQvLyBGVUNLSU5HIFBIQVNFUiEgSSBIQVRFIFUgQklUQ0hcblx0XHR0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnYmcnKS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLmdhbWUuYWRkLnNwcml0ZSgyMjQsIDAsICdiZycpLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDIyNCAqIDIsIDAsICdiZycpLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXG5cdFx0dGhpcy53b3JsZC5zZXRCb3VuZHMoMCwgMCwgMzAgKiAxNiwgMTAwICogMTYpO1xuXHRcdC8vIHRoaXMuY2FtZXJhLnNldEJvdW5kc1RvV29ybGRcdCgpO1xuXG5cdFx0dGhpcy5zb2xpZHMgPSB0aGlzLm1hcC5jcmVhdGVMYXllcignc29saWRzJyk7XG5cblx0XHR0aGlzLnNvbGlkcy5yZXNpemVXb3JsZCgpO1xuXHRcdHRoaXMuc29saWRzLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5tYXAuc2V0Q29sbGlzaW9uQmV0d2VlbigwLCAyNzAsIHRoaXMuc29saWRzKTtcblxuXHRcdHRoaXMuZGVjb3JzID0gdGhpcy5tYXAuY3JlYXRlTGF5ZXIoJ2RlY29yJyk7XG5cdFx0dGhpcy5kZWNvcnMucmVzaXplV29ybGQoKTtcblx0XHR0aGlzLmRlY29ycy5zbW9vdGhlZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5kZWNvcnMyID0gdGhpcy5tYXAuY3JlYXRlTGF5ZXIoJ2RlY29yMicpO1xuXHRcdGlmICh0aGlzLmRlY29yczIpIHtcblx0XHRcdHRoaXMuZGVjb3JzMi5yZXNpemVXb3JsZCgpO1xuXHRcdFx0dGhpcy5kZWNvcnMyLnNtb290aGVkID0gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gUGF0aEZpbmRlcnNcblx0XHQvL2xldCBhcnIgPSBbXTtcblx0XHQvL2xldCBwcm9wcyA9IHRoaXMubWFwLnRpbGVcdHNldHNbMF0udGlsZVByb3BlcnRpZXM7XG5cdFx0Ly9mb3IgKGxldCBpIGluIHByb3BzKSB7XG5cdFx0Ly9cdHRoaXMubWFwLnNldENvbGxpc2lvbigraSwgdHJ1ZSwgdGhpcy5maXJzdExheWVyTWFwKTtcblx0XHQvL31cblx0XHQvL3RoaXMucGF0aGZpbmRlciA9IHRoaXMuZ2FtZS5wbHVnaW5zLmFkZChQaGFzZXIuUGx1Z2luLlBhdGhGaW5kZXJQbHVnaW4pO1xuXHRcdC8vdGhpcy5wYXRoZmluZGVyLnNldEdyaWQodGhpcy5tYXAubGF5ZXJzWzBdLmRhdGEsIGFycik7XG5cblx0XHQvLyBncm91cFxuXHRcdHRoaXMuYnVsbGV0cyA9IHRoaXMuYWRkLmdyb3VwKCk7XG5cdFx0dGhpcy5lbmVtaWVzID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXHRcdHRoaXMuaXRlbXMgPSB0aGlzLmFkZC5ncm91cCgpO1xuXHRcdHRoaXMuZWxlbWVudHMgPSB0aGlzLmFkZC5ncm91cCgpO1xuXHRcdHRoaXMuaXRlbXMuZW5hYmxlQm9keSA9IHRydWU7XG5cblx0XHR0aGlzLnN3YXBCdXR0b24gPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuWik7XG5cdFx0dGhpcy5qdW1wQnV0dG9uID0gdGhpcy5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLlcpO1xuXHRcdHRoaXMubGVmdEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5BKTtcblx0XHR0aGlzLnJpZ2h0QnV0dG9uID0gdGhpcy5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkQpO1xuXHRcdHRoaXMuaXNQbGF5ZXJNYWluID0gdHJ1ZTtcblxuXHRcdHRoaXMuZGlmZlNsYXZlID0gMTtcblx0XHR0aGlzLnNsYXZlTGVmdCA9IDA7XG5cdFx0dGhpcy5zbGF2ZVJpZ2h0ID0gMDtcblxuXHRcdHRoaXMuY29udHJvbHMgPSBbXTtcblxuXHRcdHRoaXMuc3dhcEJ1dHRvbi5vblVwLmFkZCgoKSA9PiB0aGlzLnN3YXBIZXJvKCkpO1xuXHRcdHRoaXMuX2NyZWF0ZUVuZW1pZXMoKTtcblxuXHRcdGxldCBzdGFydCA9IDIwO1xuXHRcdGxldCB5ID0gMjEwO1xuXHRcdGNvbnN0IG1pbmlwYWx5YSA9IHRoaXMuYWRkLnNwcml0ZShzdGFydCArIDMwLCB5LCAnbWluaXBhbHlhJyk7XG5cdFx0bWluaXBhbHlhLnNjYWxlLnNldCgyKTtcblx0XHRtaW5pcGFseWEuYW5jaG9yLnNldCgwLjUpO1xuXHRcdG1pbmlwYWx5YS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHRtaW5pcGFseWEuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0ID0gVUkuYWRkVGV4dChzdGFydCArIDM0LCB5ICsgMywgVUkuYnVsbGV0cywgJ0FyaWFsJywgMTQsICcjMDAnKTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQuYW5jaG9yLnNldCgwLCAwLjUpO1xuXG5cdFx0Y29uc3QgbWluaW1vemcgPSB0aGlzLmFkZC5zcHJpdGUoc3RhcnQgKyA5MCwgeSwgJ21pbmltb3pnJyk7XG5cdFx0bWluaW1vemcuc2NhbGUuc2V0KDIpO1xuXHRcdG1pbmltb3pnLmFuY2hvci5zZXQoMC41KTtcblx0XHRtaW5pbW96Zy5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHRtaW5pbW96Zy5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMub3JnYW5zVGV4dCA9IFVJLmFkZFRleHQoc3RhcnQgKyA5NCwgeSArIDMsIDAsICdBcmlhbCcsIDE0LCAnI2ZmMDAwMCcpO1xuXHRcdHRoaXMub3JnYW5zVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQuYW5jaG9yLnNldCgwLCAwLjUpO1xuXHR9XG5cdF9jcmVhdGVFbmVtaWVzKCkge1xuXHRcdHRoaXMubWFwLm9iamVjdHMuc3Bhd24gJiZcblx0XHRcdHRoaXMubWFwLm9iamVjdHMuc3Bhd24uZm9yRWFjaChzcGF3biA9PiB7XG5cdFx0XHRcdGNvbnN0IGFyZ3MgPSBbc3Bhd24ueCArIHNwYXduLndpZHRoIC8gMiwgc3Bhd24ueSArIHNwYXduLmhlaWdodCAvIDIsIHNwYXduLnR5cGUsIHNwYXduLm5hbWVdO1xuXHRcdFx0XHRpZiAoc3Bhd24udHlwZSA9PT0gJ3BsYXllcicpIHtcblx0XHRcdFx0XHR0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIodGhpcywgLi4uYXJncyk7XG5cdFx0XHRcdFx0dGhpcy5tYWluSGVybyA9IHRoaXMucGxheWVyLnNwcml0ZTtcblx0XHRcdFx0XHR0aGlzLmNhbWVyYS5mb2xsb3codGhpcy5tYWluSGVybywgUGhhc2VyLkNhbWVyYS5GT0xMT1dfUExBVEZPUk1FUiwgMC4xLCAwLjEpO1xuXHRcdFx0XHRcdHRoaXMucGxheWVyLndlYXBvbi53ZWFwb24ub25GaXJlLmFkZCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRVSS5idWxsZXRzIC09IDE7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5jb250cm9scy5wdXNoKFthcmdzWzBdLCBhcmdzWzFdLCBmYWxzZV0pO1xuXHRcdFx0XHRcdHRoaXMuc3RydWN0U2xhdmVzKCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2ZpcmUnKSB7XG5cdFx0XHRcdFx0dGhpcy5lbGVtZW50cy5hZGQobmV3IEZpcmUodGhpcywgLi4uYXJncykuc3ByaXRlKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZmluaXNoJykge1xuXHRcdFx0XHRcdHRoaXMuZmluaXNoID0gc3Bhd247XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2ZseScpIHtcblx0XHRcdFx0XHR0aGlzLmVsZW1lbnRzLmFkZChuZXcgRmx5KHRoaXMsIC4uLmFyZ3MpLnNwcml0ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2RlYXRoJykge1xuXHRcdFx0XHRcdHRoaXMuZWxlbWVudHMuYWRkKG5ldyBEZWF0aCh0aGlzLCAuLi5hcmdzKS5zcHJpdGUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNwYXduLnR5cGUgPT09ICdlbmVteScpIHtcblx0XHRcdFx0XHRsZXQgZW5lbXkgPSBuZXcgRW5lbXkodGhpcywgLi4uYXJncyk7XG5cdFx0XHRcdFx0dGhpcy5lbmVtaWVzLmFkZChlbmVteS5zcHJpdGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0fVxuXG5cdHN3YXBIZXJvKG5vdFN3YXApIHtcblx0XHRjb25zdCBzbGF2ZXMgPSB0aGlzLmVuZW1pZXMuY2hpbGRyZW4uZmlsdGVyKGUgPT4gZS5jbGFzcy50eXBlID09PSAnc2xhdmUnICYmICFlLmNsYXNzLmlzRGVhZCk7XG5cdFx0Y29uc3Qgc2xhdmUgPSBzbGF2ZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2xhdmVzLmxlbmd0aCldO1xuXHRcdGlmICghc2xhdmUpIHtcblx0XHRcdHRoaXMubWFpbkhlcm8uaXNNYWluSGVybyA9IGZhbHNlO1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuXHRcdFx0dGhpcy5pc1BsYXllck1haW4gPSB0cnVlO1xuXHRcdFx0dGhpcy5tYWluSGVybyA9IHRoaXMucGxheWVyLnNwcml0ZTtcblx0XHRcdHRoaXMuY2FtZXJhLmZvbGxvdyh0aGlzLm1haW5IZXJvLCBQaGFzZXIuQ2FtZXJhLkZPTExPV19QTEFURk9STUVSLCAwLjEsIDAuMSk7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmlzTWFpbkhlcm8gPSB0cnVlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMubWFpbkhlcm8uaXNNYWluSGVybyA9IGZhbHNlO1xuXHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS55ID0gMDtcblx0XHRpZiAoIW5vdFN3YXApIHRoaXMuaXNQbGF5ZXJNYWluID0gIXRoaXMuaXNQbGF5ZXJNYWluO1xuXHRcdHRoaXMubWFpbkhlcm8gPSB0aGlzLmlzUGxheWVyTWFpbiA/IHRoaXMucGxheWVyLnNwcml0ZSA6IHNsYXZlO1xuXHRcdHRoaXMuY2FtZXJhLmZvbGxvdyh0aGlzLm1haW5IZXJvLCBQaGFzZXIuQ2FtZXJhLkZPTExPV19QTEFURk9STUVSLCAwLjEsIDAuMSk7XG5cdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gdHJ1ZTtcblx0fVxuXG5cdGRyb3BPcmdhbih4LCB5LCByb3RhdGlvbikge1xuXHRcdGNvbnN0IHR5cGVzID0gW0xJVkVSLCBIRUFSVCwgU1RPTUFDSCwgQlJBSU5dO1xuXHRcdGNvbnN0IHR5cGUgPSB0eXBlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0eXBlcy5sZW5ndGgpXTtcblx0XHRjb25zdCBvcmdhbiA9IHRoaXMuYWRkLnNwcml0ZSh4LCB5LCB0eXBlKTtcblx0XHR0aGlzLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShvcmdhbik7XG5cblx0XHRvcmdhbi5ib2R5LmdyYXZpdHkueSA9IDEwMDA7XG5cdFx0b3JnYW4uYm9keS52ZWxvY2l0eS54IC09IHRoaXMucmFuZG9tKC0xMDAsIDEwMCk7XG5cdFx0b3JnYW4uYm9keS52ZWxvY2l0eS55IC09IHRoaXMucmFuZG9tKDEwLCAxMDApO1xuXHRcdG9yZ2FuLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuaXRlbXMuYWRkKG9yZ2FuKTtcblx0fVxuXG5cdHJhbmRvbShtaW4sIG1heCkge1xuXHRcdHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyAtbWluO1xuXHR9XG5cblx0YWRkU2xhdmUoKSB7XG5cdFx0aWYgKFVJLm9yZ2FucyA8IDQpIHJldHVybjtcblx0XHRjb25zdCBzbGF2ZXMgPSB0aGlzLmVuZW1pZXMuY2hpbGRyZW4uZmlsdGVyKGUgPT4gZS5jbGFzcy50eXBlID09PSAnc2xhdmUnICYmICFlLmNsYXNzLmlzRGVhZCk7XG5cdFx0Y29uc3QgaW5kZXggPSBNYXRoLm1heCh0aGlzLmNvbnRyb2xzLmxlbmd0aCAtIDEwICogKHNsYXZlcy5sZW5ndGggKyAxKSwgMCk7XG5cdFx0Y29uc3QgW3gsIHldID0gdGhpcy5jb250cm9sc1tpbmRleF07XG5cdFx0bGV0IHNsYXZlID0gbmV3IFNsYXZlKHRoaXMsIHgsIHksIGluZGV4LCAxMCAqIChzbGF2ZXMubGVuZ3RoICsgMSkpO1xuXHRcdHRoaXMuZW5lbWllcy5hZGQoc2xhdmUuc3ByaXRlKTtcblx0XHRVSS5vcmdhbnMgLT0gNDtcblx0fVxuXG5cdHJlc3RydWN0U2xhdmVzKCkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRVSS5vcmdhbnMgKz0gc2xhdmVzLmxlbmd0aCAqIDQ7XG5cdH1cblxuXHRzdHJ1Y3RTbGF2ZXMoKSB7XG5cdFx0Y29uc3Qgc2xhdmVzID0gTWF0aC5mbG9vcihVSS5vcmdhbnMgLyA0KTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNsYXZlczsgaSsrKSB7XG5cdFx0XHR0aGlzLmFkZFNsYXZlKCk7XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlQ29udHJvbCgpIHtcblx0XHRpZiAodGhpcy5pc1BsYXllck1haW4gJiYgKHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54IHx8IHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS55KSlcblx0XHRcdHRoaXMuY29udHJvbHMucHVzaChbdGhpcy5wbGF5ZXIuc3ByaXRlLngsIHRoaXMucGxheWVyLnNwcml0ZS55LCB0aGlzLm1haW5IZXJvLmJvZHkub25GbG9vcigpXSk7XG5cblx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueCA9IDA7XG5cblx0XHRpZiAodGhpcy5sZWZ0QnV0dG9uLmlzRG93bikge1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggPSAtMTUwO1xuXHRcdFx0dGhpcy5tYWluSGVyby5zY2FsZS54ID0gLTE7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnJpZ2h0QnV0dG9uLmlzRG93bikge1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggPSAxNTA7XG5cdFx0XHR0aGlzLm1haW5IZXJvLnNjYWxlLnggPSAxO1xuXHRcdH1cblx0XHRpZiAodGhpcy5qdW1wQnV0dG9uLmlzRG93biAmJiB0aGlzLm1haW5IZXJvLmJvZHkub25GbG9vcigpKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG5cdFx0fVxuXG5cdFx0aWYgKFVJLmJ1bGxldHMgJiYgdGhpcy5nYW1lLmlucHV0Lm1vdXNlUG9pbnRlci5pc0Rvd24gJiYgdGhpcy5pc1BsYXllck1haW4gJiYgIXRoaXMubWFpbkhlcm8uY2xhc3MuaXNEZWFkKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmNsYXNzLndlYXBvbi5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMuYnVsbGV0c1RleHQudGV4dCA9IFVJLmJ1bGxldHM7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LnRleHQgPSBVSS5vcmdhbnM7XG5cblx0XHR0aGlzLnBsYXllci5fdXBkYXRlKCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVuZW1pZXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZW5lbWllcy5jaGlsZHJlbltpXS5jbGFzcy5fdXBkYXRlKCk7XG5cdFx0fVxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50cy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5lbGVtZW50cy5jaGlsZHJlbltpXS5jbGFzcy51cGRhdGUoKTtcblx0XHR9XG5cdFx0dGhpcy5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuaXRlbXMsIHRoaXMuc29saWRzLCBpdGVtID0+IChpdGVtLmJvZHkudmVsb2NpdHkueCA9IDApKTtcblx0XHR0aGlzLnVwZGF0ZUNvbnRyb2woKTtcblxuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5wbGF5ZXIuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdGNvbnN0IHJlY3QgPSB0aGlzLmZpbmlzaDtcblx0XHRpZiAoeCA8IHJlY3QueCArIDE2ICYmIHggKyAxNiA+IHJlY3QueCAmJiB5IDwgcmVjdC55ICsgMTYgJiYgeSArIDE2ID4gcmVjdC55KSB7XG5cdFx0XHR0aGlzLnJlc3RydWN0U2xhdmVzKCk7XG5cdFx0XHR0aGlzLnN0YXRlLnJlc3RhcnQoJ0xldmVsJyk7XG5cdFx0fVxuXHRcdC8vdGhpcy5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuZW5lbWllcywgdGhpcy5lbmVtaWVzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsO1xuIiwiY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUkuanMnKTtcblxuY2xhc3MgTWVudSB7XG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCA0ODAsIDMyMCk7XG5cdFx0Ly8gdGhpcy5iZyA9IHRoaXMuYWRkLnRpbGVTcHJpdGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQsICdiZycpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhdGgxID0gVUkuYWRkVGV4dCgxNjAsIDUwLCAnZm9udCcsICdCTElOSycsIDM1KTtcblx0XHQvLyB0aGlzLmFkZC50d2Vlbih0aGlzLmxhYmVsUGF0aDEpXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAwfSwgMjAwKVxuXHRcdC8vIFx0LnRvKHthbHBoYTogMX0sIDEwMClcblx0XHQvLyBcdC5zdGFydCgpXG5cdFx0Ly8gXHQubG9vcCgpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhcnQyID0gVUkuYWRkVGV4dCgzMjAsIDU1LCAnZm9udCcsICdTSE9PVEVSJywgMjUpO1xuXG5cdFx0Ly8gdGhpcy5idG5TdGFydCA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclktMzUsICdmb250JywgJ1NUQVJUJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ0xldmVsTWFuYWdlcicpO1xuXHRcdC8vIH0pO1xuXHRcdC8vIHRoaXMuYnRuU2V0dGluZ3MgPSBVSS5hZGRUZXh0QnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZKzEwLCAnZm9udCcsICdTRVRUSU5HUycsIDMwLCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdTZXR0aW5ncycpO1xuXHRcdC8vIH0pO1xuXG5cdFx0Ly8gdGhpcy5pbmZvID0gVUkuYWRkVGV4dCgxMCwgNSwgJ2ZvbnQyJywgJ1Bvd2VyZWQgYnkgYXpiYW5nIEB2MC4xJywgMTQpO1xuXHRcdC8vIHRoaXMuaW5mby5hbmNob3Iuc2V0KDApO1xuXHR9XG5cdHVwZGF0ZSgpIHt9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJLmpzJyk7XG5cbmNsYXNzIFByZWxvYWQge1xuXHRwcmVsb2FkKCkge1xuXHRcdC8vIE11c2ljXG5cdFx0Ly8gdGhpcy5sb2FkLmF1ZGlvKFwibXVzaWMxXCIsIFwiLi9hc3NldHMvbXVzaWMvdGhlbWUtMS5vZ2dcIik7XG5cblx0XHQvLyBJbWFnZXNcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJiZ1wiLCBcIi4vYXNzZXRzL2JnLnBuZ1wiKTtcblxuXHRcdC8vICBVSVxuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImxpZmVib3hcIiwgXCIuL2Fzc2V0cy9VSS9saWZlYm94LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJsaWZlcmVjdFwiLCBcIi4vYXNzZXRzL1VJL2xpZmVyZWN0LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJ3aW5kb3dcIiwgXCIuL2Fzc2V0cy9VSS93aW5kb3cucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcInZqb3lfYm9keVwiLCBcIi4vYXNzZXRzL1VJL2JvZHkucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcInZqb3lfY2FwXCIsIFwiLi9hc3NldHMvVUkvYnV0dG9uLnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJidXR0b25KdW1wXCIsIFwiLi9hc3NldHMvVUkvYnV0dG9uSnVtcC5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwiYnV0dG9uRmlyZVwiLCBcIi4vYXNzZXRzL1VJL2J1dHRvbkZpcmUucG5nXCIpO1xuXG5cdFx0Ly8gQW5pbWF0aW9uc1xuXHRcdC8vIHRoaXMubG9hZC5zcHJpdGVzaGVldChcImZ4X2ZpcmVcIiwgXCIuL2Fzc2V0cy9hbmltYXRpb25zL2ZpcmUucG5nXCIsIDMyLCAzMywgNik7XG5cblx0XHQvLyBHYW1lIEF0bGFzZXNcblx0XHQvLyB0aGlzLmxvYWQuYXRsYXMoXG5cdFx0Ly8gXHRcImFzc2V0cy9cIixcblx0XHQvLyBcdFwiYXNzZXRzL2F0bGFzZXMvaXRlbXMucG5nXCIsXG5cdFx0Ly8gXHRcImFzc2V0cy9hdGxhc2VzL2l0ZW1zLmpzb25cIixcblx0XHQvLyBcdFBoYXNlci5Mb2FkZXIuVEVYVFVSRV9BVExBU19KU09OX0hBU0hcblx0XHQvLyApO1xuXG5cdFx0Ly8gTGV2ZWxzXG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2xldmVsMScsICcuL2Fzc2V0cy9sZXZlbHMvbGV2ZWwxLmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblx0XHR0aGlzLmxvYWQudGlsZW1hcCgnbGV2ZWwyJywgJy4vYXNzZXRzL2xldmVscy9sZXZlbDIuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXHRcdHRoaXMubG9hZC50aWxlbWFwKCdsZXZlbDMnLCAnLi9hc3NldHMvbGV2ZWxzL2xldmVsMy5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2xldmVsNCcsICcuL2Fzc2V0cy9sZXZlbHMvbGV2ZWw0Lmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblx0XHR0aGlzLmxvYWQudGlsZW1hcCgnaG9tZScsICcuL2Fzc2V0cy9sZXZlbHMvaG9tZS5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cblx0XHR0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ2ZpcmVfYmx1ZScsICcuL2Fzc2V0cy9hdGxhc2VzL2ZpcmVfYmx1ZS5wbmcnLCAxNiwgMTYsIDQpO1xuXG5cdFx0dGhpcy5sb2FkLmltYWdlKCd0aWxlbWFwJywgJy4vYXNzZXRzL2F0bGFzZXMvdGlsZW1hcC5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2JnJywgJy4vYXNzZXRzL2F0bGFzZXMvZm9uLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgncGxheWVyJywgJy4vYXNzZXRzL2F0bGFzZXMvcGxheWVyLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnZ3VuJywgJy4vYXNzZXRzL2F0bGFzZXMvZ3VuLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnYnVsbGV0JywgJy4vYXNzZXRzL2F0bGFzZXMvYnVsbGV0LnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgncGVjaGVuJywgJy4vYXNzZXRzL2F0bGFzZXMvcGVjaGVuLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnc2VyZGVjaGtvJywgJy4vYXNzZXRzL2F0bGFzZXMvc2VyZGVjaGtvLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnemhlbHVkb2snLCAnLi9hc3NldHMvYXRsYXNlcy96aGVsdWRvay5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ21vemcnLCAnLi9hc3NldHMvYXRsYXNlcy9tb3pnLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnZGVtb24nLCAnLi9hc3NldHMvYXRsYXNlcy9kZW1vbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3pvbWJpJywgJy4vYXNzZXRzL2F0bGFzZXMvem9tYmkucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdjaGlyaXBha2hhJywgJy4vYXNzZXRzL2F0bGFzZXMvY2hpcmlwYWtoYS5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2dsdXonLCAnLi9hc3NldHMvYXRsYXNlcy9nbHV6LnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnZGVhdGgnLCAnLi9hc3NldHMvYXRsYXNlcy9kZWF0aC5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ21pbmltb3pnJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaW1vemcucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pcGFseWEnLCAnLi9hc3NldHMvYXRsYXNlcy9taW5pcGFseWEucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pemFtYmknLCAnLi9hc3NldHMvYXRsYXNlcy9taW5pemFtYmkucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCduZXh0TG9jJywgJy4vYXNzZXRzL2F0bGFzZXMvbmV4dExvYy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3NjcmVlbicsICcuL2Fzc2V0cy9hdGxhc2VzL3NjcmVlbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BhdHJ5JywgJy4vYXNzZXRzL2F0bGFzZXMvcGF0cnkucG5nJyk7XG5cblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3RhYmxpY2hrYTEnLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2ExLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgndGFibGljaGthMicsICcuL2Fzc2V0cy9hdGxhc2VzL3RhYmxpY2hrYTIucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCduZXdMb2MnLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2EzLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgndGFibGljaGthNCcsICcuL2Fzc2V0cy9hdGxhc2VzL3RhYmxpY2hrYTQucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCd0YWJsaWNoa2E1JywgJy4vYXNzZXRzL2F0bGFzZXMvdGFibGljaGthNS5wbmcnKTtcblxuXHRcdHRoaXMubG9hZC5zcHJpdGVzaGVldCgnc3RhcnQnLCAnLi9hc3NldHMvYXRsYXNlcy9zdGFydC5wbmcnLCA1MCwgMTgpO1xuXHRcdHRoaXMubG9hZC5zcHJpdGVzaGVldCgncGF5JywgJy4vYXNzZXRzL2F0bGFzZXMvcGF5LnBuZycsIDUwLCAxOCk7XG5cdH1cblxuXHRjcmVhdGUoKSB7XG5cdFx0dGhpcy5zdGF0ZS5zdGFydCgnSG9tZScpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlbG9hZDtcbiJdfQ==
