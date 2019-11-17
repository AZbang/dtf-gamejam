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
		let lvl = Math.floor(Math.random() * 2) + 1;
		if (UI.notFirstLevel) {
			// САМАЯ ТУПАЯ ГЕНЕРАЦИЯ
			if (UI.isDead) {
				lvl = 'home';
			} else {
				while (lvl === UI.lastLvl) {
					lvl = Math.floor(Math.random() * 2) + 1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0RlYXRoLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VuZW15LmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VudGl0eS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9GaXJlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0ZseS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9QbGF5ZXIuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvU2xhdmUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvV2VhcG9uLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL2VudGl0aWVzLmpzb24iLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvd2VhcG9ucy5qc29uIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9pbmRleC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvbWl4aW5zL1VJLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9zdGF0ZXMvQm9vdC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL0hvbWUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9MZXZlbC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL01lbnUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9QcmVsb2FkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNsYXNzIERlYXRoIHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUgPSAnZGVhdGgnLCB0YWJsZSkge1xuXHRcdHRoaXMuaHAgPSAxO1xuXHRcdHRoaXMubGV2ZWwgPSBsZXZlbDtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh4LCB5LCAnZGVhdGgnKTtcblxuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMSwgMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5ncmF2aXR5LnkgPSAxMDAwO1xuXG5cdFx0dGhpcy53aW5kb3cgPSB0aGlzLmxldmVsLm1ha2Uuc3ByaXRlKDAsIC0xMCwgdGFibGUpO1xuXHRcdHRoaXMud2luZG93LmFuY2hvci5zZXQoMC41LCAxKTtcblx0XHR0aGlzLndpbmRvdy5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMud2luZG93LmFscGhhID0gMDtcblx0XHR0aGlzLnNwcml0ZS5hZGRDaGlsZCh0aGlzLndpbmRvdyk7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5zb2xpZHMpO1xuXG5cdFx0dGhpcy53aW5kb3cuYWxwaGEgPSAwO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHtcblx0XHRcdHRoaXMud2luZG93LmFscGhhID0gMTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlYXRoO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcblxuY2xhc3MgRW5lbXkgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSA9ICdlbmVteScpIHtcblx0XHRzdXBlcihsZXZlbCwgeCwgeSwgdHlwZSk7XG5cdFx0aWYgKHRoaXMud2VhcG9uKSB0aGlzLndlYXBvbi53ZWFwb24uZmlyZVJhdGUgPSAzMDA7XG5cdFx0dGhpcy5kaXIgPSAxO1xuXHR9XG5cblx0b25EZWFkKHJvdGF0aW9uKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnNwcml0ZS5wb3NpdGlvbjtcblx0XHR0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLmRlYWQoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKF8sIHBsKSA9PiBwbC5jbGFzcy5kZWFkKCkpO1xuXG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLmxldmVsLm1haW5IZXJvLnBvc2l0aW9uO1xuXHRcdGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Y29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdGNvbnN0IHJpZ2h0Qm90dG9tVGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblx0XHRjb25zdCBsZWZ0Qm90dG9tVGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblxuXHRcdGlmIChyaWdodFRpbGUgfHwgIXJpZ2h0Qm90dG9tVGlsZSkgdGhpcy5kaXIgPSAtMTtcblx0XHRpZiAobGVmdFRpbGUgfHwgIWxlZnRCb3R0b21UaWxlKSB0aGlzLmRpciA9IDE7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gODAgKiB0aGlzLmRpcjtcblx0XHR0aGlzLnNwcml0ZS5zY2FsZS54ID0gdGhpcy5kaXIgKiAtMTtcblxuXHRcdC8vIGVsc2UgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSAwO1xuXG5cdFx0Ly8gdGhpcy53ZWFwb24udXBkYXRlKHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZVRvWFkodGhpcy53ZWFwb24uc3ByaXRlLCB4LCB5KSk7XG5cblx0XHQvLyBpZiAodGhpcy5nYW1lLm1hdGguZGlzdGFuY2UoeCwgeSwgdGhpcy5zcHJpdGUueCwgdGhpcy5zcHJpdGUueSkgPCAxNTApIHtcblx0XHQvLyBcdCF0aGlzLmlzRGVhZCAmJiB0aGlzLndlYXBvbi5maXJlKCk7XG5cdFx0Ly8gfVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW5lbXk7XG4iLCJjb25zdCBXZWFwb24gPSByZXF1aXJlKCcuL1dlYXBvbi5qcycpO1xuY29uc3QgZW50aXRpZXMgPSByZXF1aXJlKCcuL2VudGl0aWVzLmpzb24nKTtcblxuY2xhc3MgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUsIGlzV2VhcG9uID0gdHJ1ZSkge1xuXHRcdHRoaXMudHlwZSA9IHR5cGU7XG5cdFx0dGhpcy5sZXZlbCA9IGxldmVsO1xuXHRcdHRoaXMuZ2FtZSA9IGxldmVsLmdhbWU7XG5cdFx0dGhpcy5fZW50aXR5ID0gZW50aXRpZXNbdHlwZV07XG5cblx0XHR0aGlzLnggPSB4IHx8IDA7XG5cdFx0dGhpcy55ID0geSB8fCAwO1xuXHRcdHRoaXMuc3BlZWQgPSB0aGlzLl9lbnRpdHkuc3BlZWQgfHwgMTAwO1xuXHRcdHRoaXMuaHAgPSB0aGlzLl9lbnRpdHkuaHAgfHwgMTtcblx0XHR0aGlzLnJhZGl1c1Zpc2liaWxpdHkgPSAxMDA7XG5cdFx0dGhpcy5pc0p1bXBpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmlzRGVhZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy53ZWFwb25JZCA9IHRoaXMuX2VudGl0eS53ZWFwb24gIT0gbnVsbCA/IHRoaXMuX2VudGl0eS53ZWFwb24gOiAnZ3VuJztcblx0XHR0aGlzLl9jcmVhdGVQaGFzZXJPYmplY3RzKCk7XG5cdH1cblxuXHRfY3JlYXRlUGhhc2VyT2JqZWN0cygpIHtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh0aGlzLngsIHRoaXMueSwgdGhpcy5fZW50aXR5LnRleHR1cmUpO1xuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblxuXHRcdGlmICh0aGlzLl9lbnRpdHkud2VhcG9uKSB0aGlzLndlYXBvbiA9IG5ldyBXZWFwb24odGhpcywgdGhpcy53ZWFwb25JZCk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5ncmF2aXR5LnkgPSAxMDAwO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkuZHJhZy5zZXQoMTUwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5Lm1heFZlbG9jaXR5LnNldCgxMDAwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LndpZHRoID0gMTY7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5oZWlnaHQgPSAxNjtcblx0XHR0aGlzLnNwcml0ZS5zeW5jQm91bmRzID0gdHJ1ZTtcblx0fVxuXG5cdF91cGRhdGUoKSB7XG5cdFx0aWYgKHRoaXMuaXNEZWFkKSByZXR1cm47XG5cblx0XHQvLyBjb2xsaXNpb24gcGVyc29uIHdpdGggYnVsbGV0c1xuXHRcdGxldCBidWxsZXRzID0gdGhpcy5sZXZlbC5idWxsZXRzLmNoaWxkcmVuO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYnVsbGV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09IGJ1bGxldHNbaV0udHlwZU93bmVyIHx8XG5cdFx0XHRcdCh0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTbGF2ZScgJiYgYnVsbGV0c1tpXS50eXBlT3duZXIgPT09ICdQbGF5ZXInKVxuXHRcdFx0KVxuXHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKGJ1bGxldHNbaV0sIHRoaXMuc3ByaXRlLCAocGVyc29uLCBidWxsZXQpID0+IHtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ICs9IE1hdGguY29zKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgKz0gTWF0aC5zaW4odGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuaHAtLTtcblx0XHRcdFx0aWYgKHRoaXMuaHAgPT09IDApIHRoaXMuZGVhZChidWxsZXQucm90YXRpb24pO1xuXHRcdFx0XHRidWxsZXQua2lsbCgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gZXh0ZW5kcyB1cGRhdGUhXG5cdFx0dGhpcy51cGRhdGUgJiYgdGhpcy51cGRhdGUoKTtcblx0fVxuXG5cdGRlYWQocm90YXRpb24pIHtcblx0XHR0aGlzLmlzRGVhZCA9IHRydWU7XG5cdFx0dGhpcy5vbkRlYWQgJiYgdGhpcy5vbkRlYWQocm90YXRpb24pO1xuXHRcdHRoaXMuc3ByaXRlLmtpbGwoKTtcblx0XHRpZiAodGhpcy53ZWFwb24pIHtcblx0XHRcdHRoaXMud2VhcG9uLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR0aGlzLndlYXBvbi53ZWFwb24uZGVzdHJveSgpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcbiIsImNsYXNzIEZpcmUge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSA9ICdmaXJlJykge1xuXHRcdHRoaXMuaHAgPSAxO1xuXHRcdHRoaXMubGV2ZWwgPSBsZXZlbDtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh4LCB5LCAnZmlyZV9ibHVlJywgMSk7XG5cdFx0Y29uc3QgYW5pbSA9IHRoaXMuc3ByaXRlLmFuaW1hdGlvbnMuYWRkKCdkZWZhdWx0Jyk7XG5cdFx0YW5pbS5wbGF5KDEwLCB0cnVlKTtcblxuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMSwgMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHBsLmNsYXNzLmRlYWQoKSk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaXJlO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcblxuY2xhc3MgRmx5IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHkpIHtcblx0XHRzdXBlcihsZXZlbCwgeCwgeSwgTWF0aC5yYW5kb20oKSA8IDAuNSA/ICdnbHV6JyA6ICdjaGlyaXBha2hhJyk7XG5cdFx0dGhpcy5zdGFydCA9IFt4LCB5XTtcblx0XHR0aGlzLmF0dGFja01vZGUgPSB0cnVlO1xuXHRcdHRoaXMudGltZXIgPSAwO1xuXHR9XG5cblx0b25EZWFkKHJvdGF0aW9uKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnNwcml0ZS5wb3NpdGlvbjtcblx0XHR0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0Ly9jb25zb2xlLmxvZygnREVBRCEnKTtcblx0XHQvLyBkcm9wcyBvcmdhbnMuLi5cblx0fVxuXG5cdHRhcmdldEVuZW15KHgsIHkpIHtcblx0XHRjb25zdCBzbGF2ZXMgPSB0aGlzLmxldmVsLmVuZW1pZXMuY2hpbGRyZW4uZmlsdGVyKGUgPT4gZS5jbGFzcy50eXBlID09PSAnc2xhdmUnICYmICFlLmNsYXNzLmlzRGVhZCk7XG5cdFx0Y29uc3Qgc2xhdmUgPSBzbGF2ZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogc2xhdmVzLmxlbmd0aCldO1xuXHRcdHRoaXMudHJhY2sgPSBzbGF2ZSA/IHNsYXZlLnNwcml0ZSA6IHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHRpZiAoIXRoaXMudHJhY2sgfHwgdGhpcy50cmFjay5jbGFzcy5pc0RlYWQpIHJldHVybiB0aGlzLnRhcmdldEVuZW15KCk7XG5cdFx0aWYgKHRoaXMubGV2ZWwuZ2FtZS5tYXRoLmRpc3RhbmNlKHRoaXMudHJhY2sueCwgdGhpcy50cmFjay55LCB0aGlzLnNwcml0ZS54LCB0aGlzLnNwcml0ZS55KSA+IDMwMCkge1xuXHRcdFx0dGhpcy5zcHJpdGUucG9zaXRpb24ueCA9IHRoaXMuc3RhcnRbMF07XG5cdFx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi55ID0gdGhpcy5zdGFydFsxXTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodGhpcy50aW1lciA+IDEwMCkge1xuXHRcdFx0dGhpcy50aW1lciA9IDA7XG5cdFx0XHR0aGlzLmF0dGFja01vZGUgPSB0cnVlO1xuXHRcdH0gZWxzZSB0aGlzLnRpbWVyKys7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuZW5lbWllcywgKF8sIGVuKSA9PiB7XG5cdFx0XHRpZiAoZW4uY2xhc3MudHlwZSA9PT0gJ3NsYXZlJykge1xuXHRcdFx0XHRlbi5jbGFzcy5kZWFkKCk7XG5cdFx0XHRcdHRoaXMuYXR0YWNrTW9kZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnBsYXllci5zcHJpdGUsIChfLCBwbCkgPT4gcGwuY2xhc3MuZGVhZCgpKTtcblx0XHRjb25zdCBhbmdsZSA9IHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUubW92ZVRvWFkoXG5cdFx0XHR0aGlzLnNwcml0ZSxcblx0XHRcdHRoaXMudHJhY2sueCxcblx0XHRcdHRoaXMudHJhY2sueSAtICh0aGlzLmF0dGFja01vZGUgPyAwIDogMTIwKSxcblx0XHRcdHRoaXMuc3BlZWRcblx0XHQpO1xuXG5cdFx0Ly8gYnVsbGV0c1xuXHRcdGxldCBidWxsZXRzID0gdGhpcy5sZXZlbC5idWxsZXRzLmNoaWxkcmVuO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYnVsbGV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09IGJ1bGxldHNbaV0udHlwZU93bmVyIHx8XG5cdFx0XHRcdCh0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTbGF2ZScgJiYgYnVsbGV0c1tpXS50eXBlT3duZXIgPT09ICdQbGF5ZXInKVxuXHRcdFx0KVxuXHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKGJ1bGxldHNbaV0sIHRoaXMuc3ByaXRlLCAocGVyc29uLCBidWxsZXQpID0+IHtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ICs9IE1hdGguY29zKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgKz0gTWF0aC5zaW4odGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuZGVhZChidWxsZXQucm90YXRpb24pO1xuXHRcdFx0XHRidWxsZXQua2lsbCgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gY29uc3QgcmlnaHRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCArIDE2LCB0aGlzLnNwcml0ZS55KTtcblx0XHQvLyBjb25zdCBsZWZ0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Ly8gaWYgKHJpZ2h0VGlsZSkgdGhpcy5kaXIgPSAtMTtcblx0XHQvLyBpZiAobGVmdFRpbGUpIHRoaXMuZGlyID0gMTtcblx0XHQvLyB0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPSA4MCAqIHRoaXMuZGlyO1xuXHRcdC8vIHRoaXMuc3ByaXRlLnNjYWxlLnggPSB0aGlzLmRpciAqIC0xO1xuXG5cdFx0Ly8gZWxzZSB0aGlzLmJvZHkudmVsb2NpdHkueCA9IDA7XG5cblx0XHQvLyB0aGlzLndlYXBvbi51cGRhdGUodGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmFuZ2xlVG9YWSh0aGlzLndlYXBvbi5zcHJpdGUsIHgsIHkpKTtcblxuXHRcdC8vIGlmICh0aGlzLmdhbWUubWF0aC5kaXN0YW5jZSh4LCB5LCB0aGlzLnNwcml0ZS54LCB0aGlzLnNwcml0ZS55KSA8IDE1MCkge1xuXHRcdC8vIFx0IXRoaXMuaXNEZWFkICYmIHRoaXMud2VhcG9uLmZpcmUoKTtcblx0XHQvLyB9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGbHk7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuL0VudGl0eS5qcycpO1xuY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUknKTtcblxuY2xhc3MgUGxheWVyIGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHkpIHtcblx0XHRzdXBlcihsZXZlbCwgeCwgeSwgJ3BsYXllcicpO1xuXHRcdHRoaXMub3JnYW5zID0gW107XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0aWYgKHRoaXMuc3ByaXRlLnkgPiAzMDApIHtcblx0XHRcdHRoaXMuZGVhZCgpO1xuXHRcdH1cblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5zb2xpZHMpO1xuXG5cdFx0dGhpcy5zcHJpdGUuc2NhbGUueCA9IHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA8IDAgPyAtMSA6IDE7XG5cdFx0Y29uc3QgYW5nbGUgPSB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuYW5nbGVUb1BvaW50ZXIodGhpcy53ZWFwb24uc3ByaXRlKTtcblx0XHRpZiAoYW5nbGUgPCAtMS44IHx8IGFuZ2xlID4gMS40KSB0aGlzLnNwcml0ZS5zY2FsZS54ID0gLTE7XG5cdFx0ZWxzZSB0aGlzLnNwcml0ZS5zY2FsZS54ID0gMTtcblxuXHRcdHRoaXMud2VhcG9uLnVwZGF0ZShhbmdsZSk7XG5cblx0XHQvLyBJdGVtcyB1c2Vcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuaXRlbXMsIChzcHJpdGUsIGl0ZW0pID0+IHtcblx0XHRcdGl0ZW0ua2lsbCgpO1xuXHRcdFx0dGhpcy5vcmdhbnMucHVzaChpdGVtLnR5cGUpO1xuXHRcdFx0VUkub3JnYW5zKys7XG5cdFx0XHR0aGlzLmxldmVsLmFkZFNsYXZlKHRoaXMuc3ByaXRlLnBvc2l0aW9uLngsIHRoaXMuc3ByaXRlLnBvc2l0aW9uLnkpO1xuXHRcdH0pO1xuXHR9XG5cblx0b25Xb3VuZGVkKCkge31cblxuXHRvbkRlYWQoKSB7XG5cdFx0VUkuaXNEZWFkID0gdHJ1ZTtcblx0XHR0aGlzLmxldmVsLnJlc3RydWN0U2xhdmVzKCk7XG5cdFx0dGhpcy5sZXZlbC5zdGF0ZS5zdGFydCgnSG9tZScpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHkuanMnKTtcblxuY2xhc3MgU2xhdmUgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgaW5kZXgsIGxpbWl0KSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksICdzbGF2ZScsIGZhbHNlKTtcblx0XHR0aGlzLmluZGV4ID0gaW5kZXg7XG5cdFx0dGhpcy5saW1pdCA9IGxpbWl0O1xuXHRcdHRoaXMuc3RvcE1vdmUgPSBmYWxzZTtcblx0XHR0aGlzLm5vdEFjdGl2ZSA9IGZhbHNlO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdGlmICh0aGlzLnNwcml0ZS5pc01haW5IZXJvKSB0aGlzLm5vdEFjdGl2ZSA9IHRydWU7XG5cdFx0aWYgKHRoaXMubm90QWN0aXZlKSB7XG5cdFx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm5vdEFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLmluZGV4ID0gdGhpcy5sZXZlbC5jb250cm9scy5sZW5ndGggLSB0aGlzLmxpbWl0O1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cdFx0aWYgKHRoaXMubm90QWN0aXZlIHx8IHRoaXMuc3ByaXRlLmlzTWFpbkhlcm8gfHwgIXRoaXMubGV2ZWwuaXNQbGF5ZXJNYWluKSByZXR1cm47XG5cblx0XHQvLyBjb25zdCB7IHgsIHkgfSA9IHRoaXMubGV2ZWwubWFpbkhlcm8ucG9zaXRpb247XG5cdFx0Ly8gY29uc3QgdmVsWCA9IHRoaXMubGV2ZWwubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54O1xuXHRcdC8vaWYgKCF2ZWxYKSByZXR1cm47XG5cblx0XHRjb25zdCBbeCwgeSwgaXNHcm91ZF0gPSB0aGlzLmxldmVsLmNvbnRyb2xzW3RoaXMuaW5kZXhdO1xuXHRcdGlmICghdGhpcy5zdG9wTW92ZSkge1xuXHRcdFx0dGhpcy5zcHJpdGUuc2NhbGUueCA9IHggLSB0aGlzLnNwcml0ZS5wb3NpdGlvbi54IDwgMCA/IC0xIDogMTtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnggPSB4O1xuXHRcdFx0dGhpcy5zcHJpdGUucG9zaXRpb24ueSA9IHk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpc0dyb3VkIHx8IHRoaXMuaW5kZXggPCB0aGlzLmxldmVsLmNvbnRyb2xzLmxlbmd0aCAtIHRoaXMubGltaXQpIHtcblx0XHRcdGlmICh0aGlzLmluZGV4IDwgdGhpcy5sZXZlbC5jb250cm9scy5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdHRoaXMuaW5kZXgrKztcblx0XHRcdFx0dGhpcy5zdG9wTW92ZSA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHRoaXMuc3RvcE1vdmUgPSB0cnVlO1xuXHRcdH0gZWxzZSB0aGlzLnN0b3BNb3ZlID0gdHJ1ZTtcblxuXHRcdC8vIGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSkgfHwge307XG5cdFx0Ly8gY29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpIHx8IHt9O1xuXHRcdC8vIGNvbnN0IGRvd25MZWZ0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblx0XHQvLyBjb25zdCBkb3duUmlnaHRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55ICsgMTYpO1xuXG5cdFx0Ly8gaWYgKHRoaXMuc3ByaXRlLmJvZHkub25GbG9vcigpKSB7XG5cdFx0Ly8gXHRpZiAoIWRvd25MZWZ0VGlsZSB8fCBsZWZ0VGlsZS5jYW5Db2xsaWRlKSB7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IC0xNTA7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gXHRpZiAoIWRvd25SaWdodFRpbGUgfHwgcmlnaHRUaWxlLmNhbkNvbGxpZGUpIHtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ID0gLTQwMDtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gMTUwO1xuXHRcdC8vIFx0fVxuXHRcdC8vIH1cblxuXHRcdC8vIHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IHZlbFg7XG5cblx0XHQvLyBpZiAodGhpcy5qdW1wQnV0dG9uLmlzRG93biAmJiB0aGlzLnNwcml0ZS5ib2R5Lm9uRmxvb3IoKSAmJiB0aGlzLmdhbWUudGltZS5ub3cgPiB0aGlzLmp1bXBUaW1lcikge1xuXHRcdC8vIFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ID0gLTEwMDA7XG5cdFx0Ly8gXHR0aGlzLmp1bXBUaW1lciA9IHRoaXMuZ2FtZS50aW1lLm5vdyArIDUwMDtcblx0XHQvLyB9XG5cdH1cblxuXHRvbkRlYWQoKSB7XG5cdFx0aWYgKHRoaXMuc3ByaXRlLmlzTWFpbkhlcm8pIHRoaXMubGV2ZWwuc3dhcEhlcm8odHJ1ZSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTbGF2ZTtcbiIsImNvbnN0IHdlYXBvbnMgPSByZXF1aXJlKCcuL3dlYXBvbnMuanNvbicpO1xuXG5jbGFzcyBXZWFwb24ge1xuXHRjb25zdHJ1Y3RvcihwZXJzb24sIHR5cGUpIHtcblx0XHR0aGlzLmxldmVsID0gcGVyc29uLmxldmVsO1xuXHRcdHRoaXMuZ2FtZSA9IHRoaXMubGV2ZWwuZ2FtZTtcblx0XHR0aGlzLnBlcnNvbiA9IHBlcnNvbjtcblxuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKDAsIDAsICdndW4nKTtcblx0XHR0aGlzLnNwcml0ZS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5zcHJpdGUuc21vb3RoZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMuX3dlYXBvbnMgPSB3ZWFwb25zW3R5cGVdO1xuXHRcdHRoaXMuaWQgPSB0aGlzLl93ZWFwb25zLmlkICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLmlkIDogMDtcblx0XHR0aGlzLnRyYWNrWCA9IHRoaXMuX3dlYXBvbnMudHJhY2tYICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLnRyYWNrWCA6IDE2O1xuXHRcdHRoaXMudHJhY2tZID0gdGhpcy5fd2VhcG9ucy50cmFja1kgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMudHJhY2tZIDogNDtcblx0XHR0aGlzLnNwZWVkID0gdGhpcy5fd2VhcG9ucy5zcGVlZCAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5zcGVlZCA6IDEwMDtcblx0XHR0aGlzLmRhbWFnZSA9IHRoaXMuX3dlYXBvbnMuZGFtYWdlICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLmRhbWFnZSA6IDE7XG5cdFx0dGhpcy5kZWxheSA9IHRoaXMuX3dlYXBvbnMuZGVsYXkgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMuZGVsYXkgOiAxMDtcblx0XHR0aGlzLnF1YW50aXR5ID0gdGhpcy5fd2VhcG9ucy5xdWFudGl0eSAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5xdWFudGl0eSA6IDE7XG5cblx0XHR0aGlzLndlYXBvbiA9IHRoaXMubGV2ZWwuYWRkLndlYXBvbigxMDAsICdidWxsZXQnLCBudWxsLCB0aGlzLmxldmVsLmJ1bGxldHMpO1xuXHRcdHRoaXMud2VhcG9uLnNldEJ1bGxldEZyYW1lcyh0aGlzLmlkLCB0aGlzLmlkLCB0cnVlKTtcblx0XHR0aGlzLndlYXBvbi5idWxsZXRLaWxsVHlwZSA9IFBoYXNlci5XZWFwb24uS0lMTF9XT1JMRF9CT1VORFM7XG5cdFx0dGhpcy53ZWFwb24uYnVsbGV0U3BlZWQgPSB0aGlzLnNwZWVkO1xuXHRcdHRoaXMud2VhcG9uLmZpcmVSYXRlID0gdGhpcy5kZWxheTtcblx0XHR0aGlzLndlYXBvbi5idWxsZXRzLnR5cGVPd25lciA9IHRoaXMucGVyc29uLmNvbnN0cnVjdG9yLm5hbWU7XG5cblx0XHR0aGlzLndlYXBvbi50cmFja1Nwcml0ZSh0aGlzLnBlcnNvbi5zcHJpdGUpO1xuXHR9XG5cblx0dXBkYXRlVHJhY2soeCwgeSkge1xuXHRcdHRoaXMuc3ByaXRlLmFuZ2xlID0gdGhpcy5sZXZlbC5nYW1lLmFuZ2xlQmV0d2Vlbih0aGlzLnNwcml0ZSk7XG5cdH1cblxuXHRmaXJlKHgsIHkpIHtcblx0XHRsZXQgYnVsbGV0ID0gdGhpcy53ZWFwb24uZmlyZSgpO1xuXHRcdHJldHVybiB0cnVlO1xuXHRcdC8vIGlmIChidWxsZXQpIHtcblx0XHQvLyBcdHRoaXMucGVyc29uLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggLT0gTWF0aC5jb3ModGhpcy5zcHJpdGUucm90YXRpb24pICogMTAwO1xuXHRcdC8vIFx0dGhpcy5wZXJzb24uc3ByaXRlLmJvZHkudmVsb2NpdHkueSAtPSBNYXRoLnNpbih0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDA7XG5cdFx0Ly8gXHRyZXR1cm4gdHJ1ZTtcblx0XHQvLyB9XG5cdH1cblx0dXBkYXRlKGFuZ2xlKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnBlcnNvbi5zcHJpdGUucG9zaXRpb247XG5cdFx0dGhpcy5zcHJpdGUucG9zaXRpb24uc2V0KHgsIHkgKyAzKTtcblx0XHR0aGlzLnNwcml0ZS5yb3RhdGlvbiA9IGFuZ2xlO1xuXHRcdHRoaXMud2VhcG9uLmZpcmVBbmdsZSA9IHRoaXMuZ2FtZS5tYXRoLnJhZFRvRGVnKGFuZ2xlKTtcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLndlYXBvbi5idWxsZXRzLCB0aGlzLmxldmVsLnNvbGlkcywgKGJ1bGxldCwgdGlsZSkgPT4ge1xuXHRcdFx0YnVsbGV0LmtpbGwoKTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYXBvbjtcbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJwbGF5ZXJcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcInBsYXllclwiLFxuXHRcdFwianVtcFwiOiAzLFxuXHRcdFwic3BlZWRcIjogMTAwLFxuXHRcdFwiaHBcIjogMSxcblx0XHRcIndlYXBvblwiOiBcImd1blwiXG5cdH0sXG5cdFwic2xhdmVcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcInpvbWJpXCIsXG5cdFx0XCJqdW1wXCI6IDMsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJocFwiOiAxLFxuXHRcdFwid2VhcG9uXCI6IFwiXCJcblx0fSxcblx0XCJlbmVteVwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwiZGVtb25cIixcblx0XHRcImp1bXBcIjogMyxcblx0XHRcInNwZWVkXCI6IDEwMCxcblx0XHRcImhwXCI6IDEsXG5cdFx0XCJyYWRpdXNWaXNpYmlsaXR5XCI6IDE1MCxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH0sXG5cdFwiZ2x1elwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwiZ2x1elwiLFxuXHRcdFwic3BlZWRcIjogNzAsXG5cdFx0XCJocFwiOiAyLFxuXHRcdFwid2VhcG9uXCI6IFwiXCJcblx0fSxcblx0XCJjaGlyaXBha2hhXCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJjaGlyaXBha2hhXCIsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJocFwiOiAxLFxuXHRcdFwid2VhcG9uXCI6IFwiXCJcblx0fVxufVxuIiwibW9kdWxlLmV4cG9ydHM9e1xuXHRcImd1blwiOiB7XG5cdFx0XCJpZFwiOiAxLFxuXHRcdFwicmFuZ2VcIjogMTAwLFxuXHRcdFwic3BlZWRcIjogNDAwLFxuXHRcdFwiZGFtYWdlXCI6IDEwLFxuXHRcdFwiZGVsYXlcIjogNDAwLFxuXHRcdFwicXVhbnRpdHlcIjogMTAsXG5cdFx0XCJ0cmFja1hcIjogMSxcblx0XHRcInRyYWNrWVwiOiAxXG5cdH1cbn1cbiIsImNvbnN0IEJvb3QgPSByZXF1aXJlKCcuL3N0YXRlcy9Cb290LmpzJyk7XG5jb25zdCBQcmVsb2FkID0gcmVxdWlyZSgnLi9zdGF0ZXMvUHJlbG9hZC5qcycpO1xuY29uc3QgTWVudSA9IHJlcXVpcmUoJy4vc3RhdGVzL01lbnUuanMnKTtcbmNvbnN0IExldmVsID0gcmVxdWlyZSgnLi9zdGF0ZXMvTGV2ZWwuanMnKTtcbmNvbnN0IEhvbWUgPSByZXF1aXJlKCcuL3N0YXRlcy9Ib21lLmpzJyk7XG5cbnZhciByZWFkeSA9ICgpID0+IHtcblx0dmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoNDgwLCAxNCAqIDE2LCBQaGFzZXIuQVVUTywgJ1Nob290ZXJCbGluaycpO1xuXG5cdGdhbWUuc3RhdGUuYWRkKCdNZW51JywgTWVudSk7XG5cdGdhbWUuc3RhdGUuYWRkKCdIb21lJywgSG9tZSk7XG5cdGdhbWUuc3RhdGUuYWRkKCdMZXZlbCcsIExldmVsKTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ1ByZWxvYWQnLCBQcmVsb2FkKTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ0Jvb3QnLCBCb290LCB0cnVlKTtcbn07XG5cbnJlYWR5KCk7XG4iLCJ2YXIgVUkgPSB7XG5cdGxldmVsOiAxLFxuXHRidWxsZXRzOiAxMCxcblx0b3JnYW5zOiAwLFxuXHRpc0RlYWQ6IHRydWUsXG5cblx0YWRkVGV4dEJ1dHRvbjogKHggPSAwLCB5ID0gMCwgdGV4dCwgdGV4dEZhbWlseSwgZm9udFNpemUgPSAzMCwgY2IpID0+IHtcblx0XHRsZXQgdHh0ID0gVUkuYWRkVGV4dCh4LCB5LCB0ZXh0LCB0ZXh0RmFtaWx5LCBmb250U2l6ZSk7XG5cdFx0VUkuc2V0QnV0dG9uKHR4dCwgY2IpO1xuXHRcdHJldHVybiB0eHQ7XG5cdH0sXG5cblx0YWRkVGV4dDogKHggPSAwLCB5ID0gMCwgdGV4dCwgdGV4dEZhbWlseSwgZm9udFNpemUgPSAzMCwgZmlsbCA9ICcjZmZmJykgPT4ge1xuXHRcdGxldCB0eHQgPSBVSS5nYW1lLmFkZC50ZXh0KHgsIHksIHRleHQsIHsgdGV4dEZhbWlseSwgZm9udFNpemUsIGZpbGwgfSk7XG5cdFx0dHh0LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dHh0LmFuY2hvci5zZXQoMC41KTtcblx0XHRyZXR1cm4gdHh0O1xuXHR9LFxuXG5cdGFkZEljb25CdXR0b246ICh4ID0gMCwgeSA9IDAsIGtleSwgaW5kZXgsIGNiKSA9PiB7XG5cdFx0bGV0IHNwcml0ZSA9IFVJLmdhbWUuYWRkLnNwcml0ZSh4LCB5LCBrZXksIGluZGV4KTtcblx0XHRzcHJpdGUuc21vb3RoZWQgPSBmYWxzZTtcblx0XHRzcHJpdGUuc2NhbGUuc2V0KDEuNSk7XG5cdFx0VUkuc2V0QnV0dG9uKHNwcml0ZSwgY2IpO1xuXHRcdHJldHVybiBzcHJpdGU7XG5cdH0sXG5cblx0c2V0QnV0dG9uOiAob2JqLCBjYikgPT4ge1xuXHRcdG9iai5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuXHRcdGxldCB4ID0gb2JqLnNjYWxlLng7XG5cdFx0bGV0IHkgPSBvYmouc2NhbGUueTtcblxuXHRcdG9iai5ldmVudHMub25JbnB1dERvd24uYWRkKCgpID0+IHtcblx0XHRcdGlmIChvYmouZGlzYWJsZSkgcmV0dXJuO1xuXHRcdFx0VUkuZ2FtZS5hZGRcblx0XHRcdFx0LnR3ZWVuKG9iai5zY2FsZSlcblx0XHRcdFx0LnRvKHsgeDogeCArIDAuMywgeTogeSArIDAuMyB9LCAzMDApXG5cdFx0XHRcdC5zdGFydCgpO1xuXHRcdH0pO1xuXHRcdG9iai5ldmVudHMub25JbnB1dFVwLmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdGNiKCk7XG5cdFx0fSk7XG5cdFx0b2JqLmV2ZW50cy5vbklucHV0T3Zlci5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKG9iai5kaXNhYmxlKSByZXR1cm47XG5cdFx0XHRVSS5nYW1lLmFkZFxuXHRcdFx0XHQudHdlZW4ob2JqLnNjYWxlKVxuXHRcdFx0XHQudG8oeyB4OiB4ICsgMC4zLCB5OiB5ICsgMC4zIH0sIDMwMClcblx0XHRcdFx0LnN0YXJ0KCk7XG5cdFx0fSk7XG5cdFx0b2JqLmV2ZW50cy5vbklucHV0T3V0LmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdFVJLmdhbWUuYWRkXG5cdFx0XHRcdC50d2VlbihvYmouc2NhbGUpXG5cdFx0XHRcdC50byh7IHg6IHgsIHk6IHkgfSwgMzAwKVxuXHRcdFx0XHQuc3RhcnQoKTtcblx0XHR9KTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVSTtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNsYXNzIEJvb3Qge1xuXHRpbml0KCkge1xuXHRcdHRoaXMudyA9IDQ4MDtcblx0XHR0aGlzLmggPSAxNSAqIDE2O1xuXHRcdFVJLmdhbWUgPSB0aGlzLmdhbWU7XG5cdH1cblxuXHRjcmVhdGUoKSB7XG5cdFx0dGhpcy5zY2FsZS5zY2FsZU1vZGUgPSBQaGFzZXIuU2NhbGVNYW5hZ2VyLlNIT1dfQUxMO1xuXHRcdHRoaXMuc2NhbGUuZnVsbFNjcmVlblNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuRVhBQ1RfRklUO1xuXHRcdHRoaXMuc2NhbGUucGFnZUFsaWduSG9yaXpvbnRhbGx5ID0gdHJ1ZTtcblx0XHR0aGlzLnNjYWxlLnBhZ2VBbGlnblZlcnRpY2FsbHkgPSB0cnVlO1xuXHRcdHRoaXMuc2NhbGUuc2V0TWF4aW11bSgpO1xuXG5cdFx0dGhpcy5nYW1lLnJlbmRlcmVyLnJlbmRlclNlc3Npb24ucm91bmRQaXhlbHMgPSB0cnVlO1xuXHRcdFBoYXNlci5DYW52YXMuc2V0SW1hZ2VSZW5kZXJpbmdDcmlzcCh0aGlzLmdhbWUuY2FudmFzKTtcblxuXHRcdHRoaXMuc3RhdGUuc3RhcnQoJ1ByZWxvYWQnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3Q7XG4iLCJjb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSS5qcycpO1xuXG5jb25zdCBMSVZFUiA9ICdwZWNoZW4nO1xuY29uc3QgSEVBUlQgPSAnc2VyZGVjaGtvJztcbmNvbnN0IFNUT01BQ0ggPSAnemhlbHVkb2snO1xuY29uc3QgQlJBSU4gPSAnbW96Zyc7XG5cbmNsYXNzIEhvbWUge1xuXHRjcmVhdGUoKSB7XG5cdFx0dGhpcy53b3JsZC5zZXRCb3VuZHMoMCwgMCwgNDgwLCAzMjApO1xuXHRcdHRoaXMuc2NyZWVuID0gdGhpcy5hZGQuc3ByaXRlKDAsIDAsICdzY3JlZW4nKTtcblx0XHR0aGlzLnNjcmVlbi5zY2FsZS5zZXQoMik7XG5cdFx0dGhpcy5zY3JlZW4uc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLnNjcmVlbi5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5zY3JlZW4ueCA9IDQ4MCAvIDI7XG5cdFx0dGhpcy5zY3JlZW4ueSA9IDI0MCAvIDI7XG5cblx0XHR0aGlzLnBhdHJ5ID0gdGhpcy5hZGQuc3ByaXRlKDAsIDAsICdwYXRyeScpO1xuXHRcdHRoaXMucGF0cnkuc2NhbGUuc2V0KDIpO1xuXHRcdHRoaXMucGF0cnkuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLnBhdHJ5LmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnBhdHJ5LnggPSA0ODAgLyAyIC0gODA7XG5cdFx0dGhpcy5wYXRyeS55ID0gMjQwIC8gMjtcblxuXHRcdHRoaXMucGF5ID0gdGhpcy5hZGQuc3ByaXRlKDAsIDAsICdwYXknKTtcblx0XHR0aGlzLnBheS5zY2FsZS5zZXQoMik7XG5cdFx0dGhpcy5wYXkuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLnBheS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5wYXkueCA9IDQ4MCAvIDIgKyA4MDtcblx0XHR0aGlzLnBheS55ID0gMjQwIC8gMjtcblx0XHR0aGlzLnBheS5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuXHRcdHRoaXMucGF5LmV2ZW50cy5vbklucHV0VXAuYWRkKCgpID0+IHtcblx0XHRcdGlmICghVUkub3JnYW5zKSByZXR1cm47XG5cdFx0XHRVSS5vcmdhbnMgLT0gMTtcblx0XHRcdFVJLmJ1bGxldHMgKz0gMjtcblx0XHR9KTtcblxuXHRcdHRoaXMuc3RhcnQgPSB0aGlzLmFkZC5zcHJpdGUoMCwgMCwgJ3N0YXJ0Jyk7XG5cdFx0dGhpcy5zdGFydC5zY2FsZS5zZXQoMik7XG5cdFx0dGhpcy5zdGFydC5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3RhcnQuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMuc3RhcnQueCA9IDQ4MCAvIDIgKyA4MDtcblx0XHR0aGlzLnN0YXJ0LnkgPSAyNDAgLyAyICsgNTA7XG5cdFx0dGhpcy5zdGFydC5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuXHRcdHRoaXMuc3RhcnQuZXZlbnRzLm9uSW5wdXRVcC5hZGQoKCkgPT4ge1xuXHRcdFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWwnKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IG5ld3MgPSBbJ9Cl0LDQutCw0YLQvtC9INC+0YIgRFRGISDQodC+0LHQuNGA0LDQudGC0LUg0LrQvtC80LDQvdC00YMhJ107XG5cdFx0Y29uc3QgdGV4dCA9IG5ld3NbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbmV3cy5sZW5ndGgpXTtcblx0XHRVSS5hZGRUZXh0KDExMCwgNDgsIHRleHQsICdBcmlhbCcsIDE0LCAnIzAwMCcpLmFuY2hvci5zZXQoMCwgMCk7XG5cblx0XHQvL1VJLmFkZFRleHQoMTQwLCAxMjAsICfQnNCw0LPQsNC30LjQvScsICdBcmlhbCcsIDE0LCAnIzAwMCcpO1xuXG5cdFx0Ly9VSS5hZGRUZXh0KDExMCwgMTQwLCAnMiDQv9Cw0YLRgNC+0L3RiyA9IDEg0L7RgNCz0LDQvScsICdBcmlhbCcsIDE0LCAnIzAwMCcpLmFuY2hvci5zZXQoMCwgMCk7XG5cdFx0Ly8gVUkuYWRkVGV4dEJ1dHRvbigzMDAsIDE0MCwgJ9Ce0LHQvNC10L3Rj9GC0YwnLCAnQXJpYWwnLCAxNCwgKCkgPT4ge1xuXHRcdC8vIFx0aWYgKCFVSS5vcmdhbnMpIHJldHVybjtcblx0XHQvLyBcdFVJLm9yZ2FucyAtPSAxO1xuXHRcdC8vIFx0VUkuYnVsbGV0cyArPSAyO1xuXHRcdC8vIH0pLmFuY2hvci5zZXQoMCwgMCk7XG5cblx0XHQvLyB0aGlzLmJnID0gdGhpcy5hZGQudGlsZVNwcml0ZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCwgJ2JnJyk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGF0aDEgPSBVSS5hZGRUZXh0KDE2MCwgNTAsICdmb250JywgJ0JMSU5LJywgMzUpO1xuXHRcdC8vIHRoaXMuYWRkLnR3ZWVuKHRoaXMubGFiZWxQYXRoMSlcblx0XHQvLyBcdC50byh7YWxwaGE6IDB9LCAyMDApXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAxfSwgMTAwKVxuXHRcdC8vIFx0LnN0YXJ0KClcblx0XHQvLyBcdC5sb29wKCk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGFydDIgPSBVSS5hZGRUZXh0KDMyMCwgNTUsICdmb250JywgJ1NIT09URVInLCAyNSk7XG5cblx0XHQvLyB0aGlzLmJ0blN0YXJ0ID0gVUkuYWRkVGV4dEJ1dHRvbih0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWS0zNSwgJ2ZvbnQnLCAnU1RBUlQnLCAzMCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWxNYW5hZ2VyJyk7XG5cdFx0Ly8gfSk7XG5cdFx0Ly8gdGhpcy5idG5TZXR0aW5ncyA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclkrMTAsICdmb250JywgJ1NFVFRJTkdTJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ1NldHRpbmdzJyk7XG5cdFx0Ly8gfSk7XG5cblx0XHQvLyB0aGlzLmluZm8gPSBVSS5hZGRUZXh0KDEwLCA1LCAnZm9udDInLCAnUG93ZXJlZCBieSBhemJhbmcgQHYwLjEnLCAxNCk7XG5cdFx0Ly8gdGhpcy5pbmZvLmFuY2hvci5zZXQoMCk7XG5cblx0XHQvLyBVSS5hZGRUZXh0QnV0dG9uKDMwMCwgMjIwLCAn0J3QkNCn0JDQotCsID4nLCAnQXJpYWwnLCAxNCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWwnKTtcblx0XHQvLyB9KS5hbmNob3Iuc2V0KDAsIDApO1xuXG5cdFx0bGV0IHN0YXJ0ID0gMTA1O1xuXHRcdGxldCB5ID0gMTgwO1xuXHRcdGNvbnN0IG1pbmlwYWx5YSA9IHRoaXMuYWRkLnNwcml0ZShzdGFydCArIDMwLCB5LCAnbWluaXBhbHlhJyk7XG5cdFx0bWluaXBhbHlhLnNjYWxlLnNldCgyKTtcblx0XHRtaW5pcGFseWEuYW5jaG9yLnNldCgwLjUpO1xuXHRcdG1pbmlwYWx5YS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHRtaW5pcGFseWEuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0ID0gVUkuYWRkVGV4dChzdGFydCArIDM0LCB5ICsgMywgVUkuYnVsbGV0cywgJ0FyaWFsJywgMTQsICcjMDAnKTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQuYW5jaG9yLnNldCgwLCAwLjUpO1xuXG5cdFx0Y29uc3QgbWluaW1vemcgPSB0aGlzLmFkZC5zcHJpdGUoc3RhcnQgKyA5MCwgeSwgJ21pbmltb3pnJyk7XG5cdFx0bWluaW1vemcuc2NhbGUuc2V0KDIpO1xuXHRcdG1pbmltb3pnLmFuY2hvci5zZXQoMC41KTtcblx0XHRtaW5pbW96Zy5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHRtaW5pbW96Zy5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMub3JnYW5zVGV4dCA9IFVJLmFkZFRleHQoc3RhcnQgKyA5NCwgeSArIDMsIDAsICdBcmlhbCcsIDE0LCAnI2ZmMDAwMCcpO1xuXHRcdHRoaXMub3JnYW5zVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQuYW5jaG9yLnNldCgwLCAwLjUpO1xuXHR9XG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LnRleHQgPSBVSS5idWxsZXRzO1xuXHRcdHRoaXMub3JnYW5zVGV4dC50ZXh0ID0gVUkub3JnYW5zO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZTtcbiIsImNvbnN0IFBsYXllciA9IHJlcXVpcmUoJy4uL2dhbWUvUGxheWVyJyk7XG5jb25zdCBFbmVteSA9IHJlcXVpcmUoJy4uL2dhbWUvRW5lbXknKTtcbmNvbnN0IFNsYXZlID0gcmVxdWlyZSgnLi4vZ2FtZS9TbGF2ZScpO1xuY29uc3QgRmlyZSA9IHJlcXVpcmUoJy4uL2dhbWUvRmlyZScpO1xuY29uc3QgRmx5ID0gcmVxdWlyZSgnLi4vZ2FtZS9GbHknKTtcbmNvbnN0IERlYXRoID0gcmVxdWlyZSgnLi4vZ2FtZS9EZWF0aCcpO1xuXG5jb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSScpO1xuXG5jb25zdCBMSVZFUiA9ICdwZWNoZW4nO1xuY29uc3QgSEVBUlQgPSAnc2VyZGVjaGtvJztcbmNvbnN0IFNUT01BQ0ggPSAnemhlbHVkb2snO1xuY29uc3QgQlJBSU4gPSAnbW96Zyc7XG5cbmNsYXNzIExldmVsIHtcblx0Y3JlYXRlKCkge1xuXHRcdGxldCBsdmwgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSArIDE7XG5cdFx0aWYgKFVJLm5vdEZpcnN0TGV2ZWwpIHtcblx0XHRcdC8vINCh0JDQnNCQ0K8g0KLQo9Cf0JDQryDQk9CV0J3QldCg0JDQptCY0K9cblx0XHRcdGlmIChVSS5pc0RlYWQpIHtcblx0XHRcdFx0bHZsID0gJ2hvbWUnO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2hpbGUgKGx2bCA9PT0gVUkubGFzdEx2bCkge1xuXHRcdFx0XHRcdGx2bCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpICsgMTtcblx0XHRcdFx0fVxuXHRcdFx0XHRVSS5sYXN0THZsID0gbHZsO1xuXHRcdFx0fVxuXG5cdFx0XHRsdmwgPSBVSS5pc0RlYWQgPyBsdmwgOiAnbGV2ZWwnICsgbHZsO1xuXHRcdFx0VUkuaXNEZWFkID0gZmFsc2U7XG5cdFx0fSBlbHNlIGx2bCA9ICdsZXZlbDEnO1xuXHRcdFVJLm5vdEZpcnN0TGV2ZWwgPSB0cnVlO1xuXG5cdFx0dGhpcy5tYXAgPSB0aGlzLmdhbWUuYWRkLnRpbGVtYXAobHZsLCAxNiwgMTYpO1xuXHRcdHRoaXMubWFwLmFkZFRpbGVzZXRJbWFnZSgndGlsZW1hcCcpO1xuXHRcdC8vXHR0aGlzLm1hcC5kZWJ1Z01hcCA9IHRydWU7XG5cblx0XHQvL3RoaXMuZ2FtZS5jYW1lcmEuYm91bmRzID0gbnVsbDtcblx0XHQvL3RoaXMuZ2FtZS5jYW1lcmEuYm91bmRzLnNldFRvKC1JbmZpbml0eSwgLUluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHkpO1xuXG5cdFx0Ly8gRlVDS0lORyBQSEFTRVIhIEkgSEFURSBVIEJJVENIXG5cdFx0dGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ2JnJykuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5nYW1lLmFkZC5zcHJpdGUoMjI0LCAwLCAnYmcnKS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLmdhbWUuYWRkLnNwcml0ZSgyMjQgKiAyLCAwLCAnYmcnKS5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblxuXHRcdHRoaXMud29ybGQuc2V0Qm91bmRzKDAsIDAsIDMwICogMTYsIDEwMCAqIDE2KTtcblx0XHQvLyB0aGlzLmNhbWVyYS5zZXRCb3VuZHNUb1dvcmxkXHQoKTtcblxuXHRcdHRoaXMuc29saWRzID0gdGhpcy5tYXAuY3JlYXRlTGF5ZXIoJ3NvbGlkcycpO1xuXG5cdFx0dGhpcy5zb2xpZHMucmVzaXplV29ybGQoKTtcblx0XHR0aGlzLnNvbGlkcy5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMubWFwLnNldENvbGxpc2lvbkJldHdlZW4oMCwgMjcwLCB0aGlzLnNvbGlkcyk7XG5cblx0XHR0aGlzLmRlY29ycyA9IHRoaXMubWFwLmNyZWF0ZUxheWVyKCdkZWNvcicpO1xuXHRcdHRoaXMuZGVjb3JzLnJlc2l6ZVdvcmxkKCk7XG5cdFx0dGhpcy5kZWNvcnMuc21vb3RoZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMuZGVjb3JzMiA9IHRoaXMubWFwLmNyZWF0ZUxheWVyKCdkZWNvcjInKTtcblx0XHRpZiAodGhpcy5kZWNvcnMyKSB7XG5cdFx0XHR0aGlzLmRlY29yczIucmVzaXplV29ybGQoKTtcblx0XHRcdHRoaXMuZGVjb3JzMi5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIFBhdGhGaW5kZXJzXG5cdFx0Ly9sZXQgYXJyID0gW107XG5cdFx0Ly9sZXQgcHJvcHMgPSB0aGlzLm1hcC50aWxlXHRzZXRzWzBdLnRpbGVQcm9wZXJ0aWVzO1xuXHRcdC8vZm9yIChsZXQgaSBpbiBwcm9wcykge1xuXHRcdC8vXHR0aGlzLm1hcC5zZXRDb2xsaXNpb24oK2ksIHRydWUsIHRoaXMuZmlyc3RMYXllck1hcCk7XG5cdFx0Ly99XG5cdFx0Ly90aGlzLnBhdGhmaW5kZXIgPSB0aGlzLmdhbWUucGx1Z2lucy5hZGQoUGhhc2VyLlBsdWdpbi5QYXRoRmluZGVyUGx1Z2luKTtcblx0XHQvL3RoaXMucGF0aGZpbmRlci5zZXRHcmlkKHRoaXMubWFwLmxheWVyc1swXS5kYXRhLCBhcnIpO1xuXG5cdFx0Ly8gZ3JvdXBcblx0XHR0aGlzLmJ1bGxldHMgPSB0aGlzLmFkZC5ncm91cCgpO1xuXHRcdHRoaXMuZW5lbWllcyA9IHRoaXMuZ2FtZS5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLml0ZW1zID0gdGhpcy5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLmVsZW1lbnRzID0gdGhpcy5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLml0ZW1zLmVuYWJsZUJvZHkgPSB0cnVlO1xuXG5cdFx0dGhpcy5zd2FwQnV0dG9uID0gdGhpcy5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLlopO1xuXHRcdHRoaXMuanVtcEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5XKTtcblx0XHR0aGlzLmxlZnRCdXR0b24gPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuQSk7XG5cdFx0dGhpcy5yaWdodEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5EKTtcblx0XHR0aGlzLmlzUGxheWVyTWFpbiA9IHRydWU7XG5cblx0XHR0aGlzLmRpZmZTbGF2ZSA9IDE7XG5cdFx0dGhpcy5zbGF2ZUxlZnQgPSAwO1xuXHRcdHRoaXMuc2xhdmVSaWdodCA9IDA7XG5cblx0XHR0aGlzLmNvbnRyb2xzID0gW107XG5cblx0XHR0aGlzLnN3YXBCdXR0b24ub25VcC5hZGQoKCkgPT4gdGhpcy5zd2FwSGVybygpKTtcblx0XHR0aGlzLl9jcmVhdGVFbmVtaWVzKCk7XG5cblx0XHRsZXQgc3RhcnQgPSAyMDtcblx0XHRsZXQgeSA9IDIxMDtcblx0XHRjb25zdCBtaW5pcGFseWEgPSB0aGlzLmFkZC5zcHJpdGUoc3RhcnQgKyAzMCwgeSwgJ21pbmlwYWx5YScpO1xuXHRcdG1pbmlwYWx5YS5zY2FsZS5zZXQoMik7XG5cdFx0bWluaXBhbHlhLmFuY2hvci5zZXQoMC41KTtcblx0XHRtaW5pcGFseWEuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaXBhbHlhLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5idWxsZXRzVGV4dCA9IFVJLmFkZFRleHQoc3RhcnQgKyAzNCwgeSArIDMsIFVJLmJ1bGxldHMsICdBcmlhbCcsIDE0LCAnIzAwJyk7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblxuXHRcdGNvbnN0IG1pbmltb3pnID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgOTAsIHksICdtaW5pbW96ZycpO1xuXHRcdG1pbmltb3pnLnNjYWxlLnNldCgyKTtcblx0XHRtaW5pbW96Zy5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaW1vemcuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaW1vemcuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgOTQsIHkgKyAzLCAwLCAnQXJpYWwnLCAxNCwgJyNmZjAwMDAnKTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblx0fVxuXHRfY3JlYXRlRW5lbWllcygpIHtcblx0XHR0aGlzLm1hcC5vYmplY3RzLnNwYXduICYmXG5cdFx0XHR0aGlzLm1hcC5vYmplY3RzLnNwYXduLmZvckVhY2goc3Bhd24gPT4ge1xuXHRcdFx0XHRjb25zdCBhcmdzID0gW3NwYXduLnggKyBzcGF3bi53aWR0aCAvIDIsIHNwYXduLnkgKyBzcGF3bi5oZWlnaHQgLyAyLCBzcGF3bi50eXBlLCBzcGF3bi5uYW1lXTtcblx0XHRcdFx0aWYgKHNwYXduLnR5cGUgPT09ICdwbGF5ZXInKSB7XG5cdFx0XHRcdFx0dGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMsIC4uLmFyZ3MpO1xuXHRcdFx0XHRcdHRoaXMubWFpbkhlcm8gPSB0aGlzLnBsYXllci5zcHJpdGU7XG5cdFx0XHRcdFx0dGhpcy5jYW1lcmEuZm9sbG93KHRoaXMubWFpbkhlcm8sIFBoYXNlci5DYW1lcmEuRk9MTE9XX1BMQVRGT1JNRVIsIDAuMSwgMC4xKTtcblx0XHRcdFx0XHR0aGlzLnBsYXllci53ZWFwb24ud2VhcG9uLm9uRmlyZS5hZGQoKCkgPT4ge1xuXHRcdFx0XHRcdFx0VUkuYnVsbGV0cyAtPSAxO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHRoaXMuY29udHJvbHMucHVzaChbYXJnc1swXSwgYXJnc1sxXSwgZmFsc2VdKTtcblx0XHRcdFx0XHR0aGlzLnN0cnVjdFNsYXZlcygpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNwYXduLnR5cGUgPT09ICdmaXJlJykge1xuXHRcdFx0XHRcdHRoaXMuZWxlbWVudHMuYWRkKG5ldyBGaXJlKHRoaXMsIC4uLmFyZ3MpLnNwcml0ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2ZpbmlzaCcpIHtcblx0XHRcdFx0XHR0aGlzLmZpbmlzaCA9IHNwYXduO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNwYXduLnR5cGUgPT09ICdmbHknKSB7XG5cdFx0XHRcdFx0dGhpcy5lbGVtZW50cy5hZGQobmV3IEZseSh0aGlzLCAuLi5hcmdzKS5zcHJpdGUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNwYXduLnR5cGUgPT09ICdkZWF0aCcpIHtcblx0XHRcdFx0XHR0aGlzLmVsZW1lbnRzLmFkZChuZXcgRGVhdGgodGhpcywgLi4uYXJncykuc3ByaXRlKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZW5lbXknKSB7XG5cdFx0XHRcdFx0bGV0IGVuZW15ID0gbmV3IEVuZW15KHRoaXMsIC4uLmFyZ3MpO1xuXHRcdFx0XHRcdHRoaXMuZW5lbWllcy5hZGQoZW5lbXkuc3ByaXRlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdH1cblxuXHRzd2FwSGVybyhub3RTd2FwKSB7XG5cdFx0Y29uc3Qgc2xhdmVzID0gdGhpcy5lbmVtaWVzLmNoaWxkcmVuLmZpbHRlcihlID0+IGUuY2xhc3MudHlwZSA9PT0gJ3NsYXZlJyAmJiAhZS5jbGFzcy5pc0RlYWQpO1xuXHRcdGNvbnN0IHNsYXZlID0gc2xhdmVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNsYXZlcy5sZW5ndGgpXTtcblx0XHRpZiAoIXNsYXZlKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmlzTWFpbkhlcm8gPSBmYWxzZTtcblx0XHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS55ID0gMDtcblx0XHRcdHRoaXMuaXNQbGF5ZXJNYWluID0gdHJ1ZTtcblx0XHRcdHRoaXMubWFpbkhlcm8gPSB0aGlzLnBsYXllci5zcHJpdGU7XG5cdFx0XHR0aGlzLmNhbWVyYS5mb2xsb3codGhpcy5tYWluSGVybywgUGhhc2VyLkNhbWVyYS5GT0xMT1dfUExBVEZPUk1FUiwgMC4xLCAwLjEpO1xuXHRcdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gdHJ1ZTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLm1haW5IZXJvLmlzTWFpbkhlcm8gPSBmYWxzZTtcblx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IDA7XG5cdFx0aWYgKCFub3RTd2FwKSB0aGlzLmlzUGxheWVyTWFpbiA9ICF0aGlzLmlzUGxheWVyTWFpbjtcblx0XHR0aGlzLm1haW5IZXJvID0gdGhpcy5pc1BsYXllck1haW4gPyB0aGlzLnBsYXllci5zcHJpdGUgOiBzbGF2ZTtcblx0XHR0aGlzLmNhbWVyYS5mb2xsb3codGhpcy5tYWluSGVybywgUGhhc2VyLkNhbWVyYS5GT0xMT1dfUExBVEZPUk1FUiwgMC4xLCAwLjEpO1xuXHRcdHRoaXMubWFpbkhlcm8uaXNNYWluSGVybyA9IHRydWU7XG5cdH1cblxuXHRkcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pIHtcblx0XHRjb25zdCB0eXBlcyA9IFtMSVZFUiwgSEVBUlQsIFNUT01BQ0gsIEJSQUlOXTtcblx0XHRjb25zdCB0eXBlID0gdHlwZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdHlwZXMubGVuZ3RoKV07XG5cdFx0Y29uc3Qgb3JnYW4gPSB0aGlzLmFkZC5zcHJpdGUoeCwgeSwgdHlwZSk7XG5cdFx0dGhpcy5waHlzaWNzLmFyY2FkZS5lbmFibGUob3JnYW4pO1xuXG5cdFx0b3JnYW4uYm9keS5ncmF2aXR5LnkgPSAxMDAwO1xuXHRcdG9yZ2FuLmJvZHkudmVsb2NpdHkueCAtPSB0aGlzLnJhbmRvbSgtMTAwLCAxMDApO1xuXHRcdG9yZ2FuLmJvZHkudmVsb2NpdHkueSAtPSB0aGlzLnJhbmRvbSgxMCwgMTAwKTtcblx0XHRvcmdhbi50eXBlID0gdHlwZTtcblx0XHR0aGlzLml0ZW1zLmFkZChvcmdhbik7XG5cdH1cblxuXHRyYW5kb20obWluLCBtYXgpIHtcblx0XHRyZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgLW1pbjtcblx0fVxuXG5cdGFkZFNsYXZlKCkge1xuXHRcdGlmIChVSS5vcmdhbnMgPCA0KSByZXR1cm47XG5cdFx0Y29uc3Qgc2xhdmVzID0gdGhpcy5lbmVtaWVzLmNoaWxkcmVuLmZpbHRlcihlID0+IGUuY2xhc3MudHlwZSA9PT0gJ3NsYXZlJyAmJiAhZS5jbGFzcy5pc0RlYWQpO1xuXHRcdGNvbnN0IGluZGV4ID0gTWF0aC5tYXgodGhpcy5jb250cm9scy5sZW5ndGggLSAxMCAqIChzbGF2ZXMubGVuZ3RoICsgMSksIDApO1xuXHRcdGNvbnN0IFt4LCB5XSA9IHRoaXMuY29udHJvbHNbaW5kZXhdO1xuXHRcdGxldCBzbGF2ZSA9IG5ldyBTbGF2ZSh0aGlzLCB4LCB5LCBpbmRleCwgMTAgKiAoc2xhdmVzLmxlbmd0aCArIDEpKTtcblx0XHR0aGlzLmVuZW1pZXMuYWRkKHNsYXZlLnNwcml0ZSk7XG5cdFx0VUkub3JnYW5zIC09IDQ7XG5cdH1cblxuXHRyZXN0cnVjdFNsYXZlcygpIHtcblx0XHRjb25zdCBzbGF2ZXMgPSB0aGlzLmVuZW1pZXMuY2hpbGRyZW4uZmlsdGVyKGUgPT4gZS5jbGFzcy50eXBlID09PSAnc2xhdmUnICYmICFlLmNsYXNzLmlzRGVhZCk7XG5cdFx0VUkub3JnYW5zICs9IHNsYXZlcy5sZW5ndGggKiA0O1xuXHR9XG5cblx0c3RydWN0U2xhdmVzKCkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IE1hdGguZmxvb3IoVUkub3JnYW5zIC8gNCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzbGF2ZXM7IGkrKykge1xuXHRcdFx0dGhpcy5hZGRTbGF2ZSgpO1xuXHRcdH1cblx0fVxuXG5cdHVwZGF0ZUNvbnRyb2woKSB7XG5cdFx0aWYgKHRoaXMuaXNQbGF5ZXJNYWluICYmICh0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueCB8fCB0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSkpXG5cdFx0XHR0aGlzLmNvbnRyb2xzLnB1c2goW3RoaXMucGxheWVyLnNwcml0ZS54LCB0aGlzLnBsYXllci5zcHJpdGUueSwgdGhpcy5tYWluSGVyby5ib2R5Lm9uRmxvb3IoKV0pO1xuXG5cdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggPSAwO1xuXG5cdFx0aWYgKHRoaXMubGVmdEJ1dHRvbi5pc0Rvd24pIHtcblx0XHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54ID0gLTE1MDtcblx0XHRcdHRoaXMubWFpbkhlcm8uc2NhbGUueCA9IC0xO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5yaWdodEJ1dHRvbi5pc0Rvd24pIHtcblx0XHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54ID0gMTUwO1xuXHRcdFx0dGhpcy5tYWluSGVyby5zY2FsZS54ID0gMTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuanVtcEJ1dHRvbi5pc0Rvd24gJiYgdGhpcy5tYWluSGVyby5ib2R5Lm9uRmxvb3IoKSkge1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnkgPSAtNDAwO1xuXHRcdH1cblxuXHRcdGlmIChVSS5idWxsZXRzICYmIHRoaXMuZ2FtZS5pbnB1dC5tb3VzZVBvaW50ZXIuaXNEb3duICYmIHRoaXMuaXNQbGF5ZXJNYWluICYmICF0aGlzLm1haW5IZXJvLmNsYXNzLmlzRGVhZCkge1xuXHRcdFx0dGhpcy5tYWluSGVyby5jbGFzcy53ZWFwb24uZmlyZSgpO1xuXHRcdH1cblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LnRleHQgPSBVSS5idWxsZXRzO1xuXHRcdHRoaXMub3JnYW5zVGV4dC50ZXh0ID0gVUkub3JnYW5zO1xuXG5cdFx0dGhpcy5wbGF5ZXIuX3VwZGF0ZSgpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5lbmVtaWVzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmVuZW1pZXMuY2hpbGRyZW5baV0uY2xhc3MuX3VwZGF0ZSgpO1xuXHRcdH1cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZWxlbWVudHMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZWxlbWVudHMuY2hpbGRyZW5baV0uY2xhc3MudXBkYXRlKCk7XG5cdFx0fVxuXHRcdHRoaXMucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLml0ZW1zLCB0aGlzLnNvbGlkcywgaXRlbSA9PiAoaXRlbS5ib2R5LnZlbG9jaXR5LnggPSAwKSk7XG5cdFx0dGhpcy51cGRhdGVDb250cm9sKCk7XG5cblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMucGxheWVyLnNwcml0ZS5wb3NpdGlvbjtcblx0XHRjb25zdCByZWN0ID0gdGhpcy5maW5pc2g7XG5cdFx0aWYgKHggPCByZWN0LnggKyAxNiAmJiB4ICsgMTYgPiByZWN0LnggJiYgeSA8IHJlY3QueSArIDE2ICYmIHkgKyAxNiA+IHJlY3QueSkge1xuXHRcdFx0dGhpcy5yZXN0cnVjdFNsYXZlcygpO1xuXHRcdFx0dGhpcy5zdGF0ZS5yZXN0YXJ0KCdMZXZlbCcpO1xuXHRcdH1cblx0XHQvL3RoaXMucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLmVuZW1pZXMsIHRoaXMuZW5lbWllcyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMZXZlbDtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJLmpzJyk7XG5cbmNsYXNzIE1lbnUge1xuXHRjcmVhdGUoKSB7XG5cdFx0dGhpcy53b3JsZC5zZXRCb3VuZHMoMCwgMCwgNDgwLCAzMjApO1xuXHRcdC8vIHRoaXMuYmcgPSB0aGlzLmFkZC50aWxlU3ByaXRlKDAsIDAsIHRoaXMud29ybGQud2lkdGgsIHRoaXMud29ybGQuaGVpZ2h0LCAnYmcnKTtcblxuXHRcdC8vIHRoaXMubGFiZWxQYXRoMSA9IFVJLmFkZFRleHQoMTYwLCA1MCwgJ2ZvbnQnLCAnQkxJTksnLCAzNSk7XG5cdFx0Ly8gdGhpcy5hZGQudHdlZW4odGhpcy5sYWJlbFBhdGgxKVxuXHRcdC8vIFx0LnRvKHthbHBoYTogMH0sIDIwMClcblx0XHQvLyBcdC50byh7YWxwaGE6IDF9LCAxMDApXG5cdFx0Ly8gXHQuc3RhcnQoKVxuXHRcdC8vIFx0Lmxvb3AoKTtcblxuXHRcdC8vIHRoaXMubGFiZWxQYXJ0MiA9IFVJLmFkZFRleHQoMzIwLCA1NSwgJ2ZvbnQnLCAnU0hPT1RFUicsIDI1KTtcblxuXHRcdC8vIHRoaXMuYnRuU3RhcnQgPSBVSS5hZGRUZXh0QnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZLTM1LCAnZm9udCcsICdTVEFSVCcsIDMwLCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdMZXZlbE1hbmFnZXInKTtcblx0XHQvLyB9KTtcblx0XHQvLyB0aGlzLmJ0blNldHRpbmdzID0gVUkuYWRkVGV4dEJ1dHRvbih0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWSsxMCwgJ2ZvbnQnLCAnU0VUVElOR1MnLCAzMCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnU2V0dGluZ3MnKTtcblx0XHQvLyB9KTtcblxuXHRcdC8vIHRoaXMuaW5mbyA9IFVJLmFkZFRleHQoMTAsIDUsICdmb250MicsICdQb3dlcmVkIGJ5IGF6YmFuZyBAdjAuMScsIDE0KTtcblx0XHQvLyB0aGlzLmluZm8uYW5jaG9yLnNldCgwKTtcblx0fVxuXHR1cGRhdGUoKSB7fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lbnU7XG4iLCJjb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSS5qcycpO1xuXG5jbGFzcyBQcmVsb2FkIHtcblx0cHJlbG9hZCgpIHtcblx0XHQvLyBNdXNpY1xuXHRcdC8vIHRoaXMubG9hZC5hdWRpbyhcIm11c2ljMVwiLCBcIi4vYXNzZXRzL211c2ljL3RoZW1lLTEub2dnXCIpO1xuXG5cdFx0Ly8gSW1hZ2VzXG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwiYmdcIiwgXCIuL2Fzc2V0cy9iZy5wbmdcIik7XG5cblx0XHQvLyAgVUlcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJsaWZlYm94XCIsIFwiLi9hc3NldHMvVUkvbGlmZWJveC5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwibGlmZXJlY3RcIiwgXCIuL2Fzc2V0cy9VSS9saWZlcmVjdC5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwid2luZG93XCIsIFwiLi9hc3NldHMvVUkvd2luZG93LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJ2am95X2JvZHlcIiwgXCIuL2Fzc2V0cy9VSS9ib2R5LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJ2am95X2NhcFwiLCBcIi4vYXNzZXRzL1VJL2J1dHRvbi5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwiYnV0dG9uSnVtcFwiLCBcIi4vYXNzZXRzL1VJL2J1dHRvbkp1bXAucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImJ1dHRvbkZpcmVcIiwgXCIuL2Fzc2V0cy9VSS9idXR0b25GaXJlLnBuZ1wiKTtcblxuXHRcdC8vIEFuaW1hdGlvbnNcblx0XHQvLyB0aGlzLmxvYWQuc3ByaXRlc2hlZXQoXCJmeF9maXJlXCIsIFwiLi9hc3NldHMvYW5pbWF0aW9ucy9maXJlLnBuZ1wiLCAzMiwgMzMsIDYpO1xuXG5cdFx0Ly8gR2FtZSBBdGxhc2VzXG5cdFx0Ly8gdGhpcy5sb2FkLmF0bGFzKFxuXHRcdC8vIFx0XCJhc3NldHMvXCIsXG5cdFx0Ly8gXHRcImFzc2V0cy9hdGxhc2VzL2l0ZW1zLnBuZ1wiLFxuXHRcdC8vIFx0XCJhc3NldHMvYXRsYXNlcy9pdGVtcy5qc29uXCIsXG5cdFx0Ly8gXHRQaGFzZXIuTG9hZGVyLlRFWFRVUkVfQVRMQVNfSlNPTl9IQVNIXG5cdFx0Ly8gKTtcblxuXHRcdC8vIExldmVsc1xuXHRcdHRoaXMubG9hZC50aWxlbWFwKCdsZXZlbDEnLCAnLi9hc3NldHMvbGV2ZWxzL2xldmVsMS5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2xldmVsMicsICcuL2Fzc2V0cy9sZXZlbHMvbGV2ZWwyLmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblx0XHR0aGlzLmxvYWQudGlsZW1hcCgnbGV2ZWwzJywgJy4vYXNzZXRzL2xldmVscy9sZXZlbDMuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXHRcdHRoaXMubG9hZC50aWxlbWFwKCdsZXZlbDQnLCAnLi9hc3NldHMvbGV2ZWxzL2xldmVsNC5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2hvbWUnLCAnLi9hc3NldHMvbGV2ZWxzL2hvbWUuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXG5cdFx0dGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdmaXJlX2JsdWUnLCAnLi9hc3NldHMvYXRsYXNlcy9maXJlX2JsdWUucG5nJywgMTYsIDE2LCA0KTtcblxuXHRcdHRoaXMubG9hZC5pbWFnZSgndGlsZW1hcCcsICcuL2Fzc2V0cy9hdGxhc2VzL3RpbGVtYXAucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdiZycsICcuL2Fzc2V0cy9hdGxhc2VzL2Zvbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BsYXllcicsICcuL2Fzc2V0cy9hdGxhc2VzL3BsYXllci5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2d1bicsICcuL2Fzc2V0cy9hdGxhc2VzL2d1bi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2J1bGxldCcsICcuL2Fzc2V0cy9hdGxhc2VzL2J1bGxldC5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BlY2hlbicsICcuL2Fzc2V0cy9hdGxhc2VzL3BlY2hlbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3NlcmRlY2hrbycsICcuL2Fzc2V0cy9hdGxhc2VzL3NlcmRlY2hrby5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3poZWx1ZG9rJywgJy4vYXNzZXRzL2F0bGFzZXMvemhlbHVkb2sucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtb3pnJywgJy4vYXNzZXRzL2F0bGFzZXMvbW96Zy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2RlbW9uJywgJy4vYXNzZXRzL2F0bGFzZXMvZGVtb24ucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCd6b21iaScsICcuL2Fzc2V0cy9hdGxhc2VzL3pvbWJpLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnY2hpcmlwYWtoYScsICcuL2Fzc2V0cy9hdGxhc2VzL2NoaXJpcGFraGEucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdnbHV6JywgJy4vYXNzZXRzL2F0bGFzZXMvZ2x1ei5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2RlYXRoJywgJy4vYXNzZXRzL2F0bGFzZXMvZGVhdGgucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pbW96ZycsICcuL2Fzc2V0cy9hdGxhc2VzL21pbmltb3pnLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbWluaXBhbHlhJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaXBhbHlhLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbWluaXphbWJpJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaXphbWJpLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbmV4dExvYycsICcuL2Fzc2V0cy9hdGxhc2VzL25leHRMb2MucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdzY3JlZW4nLCAnLi9hc3NldHMvYXRsYXNlcy9zY3JlZW4ucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdwYXRyeScsICcuL2Fzc2V0cy9hdGxhc2VzL3BhdHJ5LnBuZycpO1xuXG5cdFx0dGhpcy5sb2FkLmltYWdlKCd0YWJsaWNoa2ExJywgJy4vYXNzZXRzL2F0bGFzZXMvdGFibGljaGthMS5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3RhYmxpY2hrYTInLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2EyLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbmV3TG9jJywgJy4vYXNzZXRzL2F0bGFzZXMvdGFibGljaGthMy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3RhYmxpY2hrYTQnLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2E0LnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgndGFibGljaGthNScsICcuL2Fzc2V0cy9hdGxhc2VzL3RhYmxpY2hrYTUucG5nJyk7XG5cblx0XHR0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ3N0YXJ0JywgJy4vYXNzZXRzL2F0bGFzZXMvc3RhcnQucG5nJywgNTAsIDE4KTtcblx0XHR0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ3BheScsICcuL2Fzc2V0cy9hdGxhc2VzL3BheS5wbmcnLCA1MCwgMTgpO1xuXHR9XG5cblx0Y3JlYXRlKCkge1xuXHRcdHRoaXMuc3RhdGUuc3RhcnQoJ0hvbWUnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByZWxvYWQ7XG4iXX0=
