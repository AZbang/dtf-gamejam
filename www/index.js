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
        if (this.sprite.y > 300) {
			this.dead();
        }

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
		//this.load.tilemap('level4', './assets/levels/level5.json', null, Phaser.Tilemap.TILED_JSON);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0RlYXRoLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VuZW15LmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VudGl0eS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9GaXJlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0ZseS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9QbGF5ZXIuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvU2xhdmUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvV2VhcG9uLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL2VudGl0aWVzLmpzb24iLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvd2VhcG9ucy5qc29uIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9pbmRleC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvbWl4aW5zL1VJLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9zdGF0ZXMvQm9vdC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL0hvbWUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9MZXZlbC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL01lbnUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9QcmVsb2FkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjbGFzcyBEZWF0aCB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5LCB0eXBlID0gJ2RlYXRoJywgdGFibGUpIHtcblx0XHR0aGlzLmhwID0gMTtcblx0XHR0aGlzLmxldmVsID0gbGV2ZWw7XG5cdFx0dGhpcy5zcHJpdGUgPSB0aGlzLmxldmVsLmFkZC5zcHJpdGUoeCwgeSwgJ2RlYXRoJyk7XG5cblx0XHR0aGlzLnNwcml0ZS5hbmNob3Iuc2V0KDEsIDAuNSk7XG5cdFx0dGhpcy5zcHJpdGUuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLnNwcml0ZS5jbGFzcyA9IHRoaXM7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5lbmFibGUodGhpcy5zcHJpdGUpO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkuZ3Jhdml0eS55ID0gMTAwMDtcblxuXHRcdHRoaXMud2luZG93ID0gdGhpcy5sZXZlbC5tYWtlLnNwcml0ZSgwLCAtMTAsIHRhYmxlKTtcblx0XHR0aGlzLndpbmRvdy5hbmNob3Iuc2V0KDAuNSwgMSk7XG5cdFx0dGhpcy53aW5kb3cuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLndpbmRvdy5hbHBoYSA9IDA7XG5cdFx0dGhpcy5zcHJpdGUuYWRkQ2hpbGQodGhpcy53aW5kb3cpO1xuXHR9XG5cblx0b25EZWFkKHJvdGF0aW9uKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnNwcml0ZS5wb3NpdGlvbjtcblx0XHQvLyBkcm9wcyBvcmdhbnMuLi5cblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuc29saWRzKTtcblxuXHRcdHRoaXMud2luZG93LmFscGhhID0gMDtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKF8sIHBsKSA9PiB7XG5cdFx0XHR0aGlzLndpbmRvdy5hbHBoYSA9IDE7XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEZWF0aDtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4vRW50aXR5Jyk7XG5cbmNsYXNzIEVuZW15IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUgPSAnZW5lbXknKSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksIHR5cGUpO1xuXHRcdGlmICh0aGlzLndlYXBvbikgdGhpcy53ZWFwb24ud2VhcG9uLmZpcmVSYXRlID0gMzAwO1xuXHRcdHRoaXMuZGlyID0gMTtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0dGhpcy5sZXZlbC5kcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pO1xuXHRcdHRoaXMubGV2ZWwuZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKTtcblx0XHRNYXRoLnJhbmRvbSgpIDwgMC41ICYmIHRoaXMubGV2ZWwuZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKTtcblx0XHQvLyBkcm9wcyBvcmdhbnMuLi5cblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuc29saWRzKTtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuZW5lbWllcywgKF8sIGVuKSA9PiB7XG5cdFx0XHRpZiAoZW4uY2xhc3MudHlwZSA9PT0gJ3NsYXZlJykge1xuXHRcdFx0XHRlbi5jbGFzcy5kZWFkKCk7XG5cdFx0XHRcdHRoaXMuZGVhZCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHBsLmNsYXNzLmRlYWQoKSk7XG5cblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMubGV2ZWwubWFpbkhlcm8ucG9zaXRpb247XG5cdFx0Y29uc3QgcmlnaHRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCArIDE2LCB0aGlzLnNwcml0ZS55KTtcblx0XHRjb25zdCBsZWZ0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Y29uc3QgcmlnaHRCb3R0b21UaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCArIDE2LCB0aGlzLnNwcml0ZS55ICsgMTYpO1xuXHRcdGNvbnN0IGxlZnRCb3R0b21UaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55ICsgMTYpO1xuXG5cdFx0aWYgKHJpZ2h0VGlsZSB8fCAhcmlnaHRCb3R0b21UaWxlKSB0aGlzLmRpciA9IC0xO1xuXHRcdGlmIChsZWZ0VGlsZSB8fCAhbGVmdEJvdHRvbVRpbGUpIHRoaXMuZGlyID0gMTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPSA4MCAqIHRoaXMuZGlyO1xuXHRcdHRoaXMuc3ByaXRlLnNjYWxlLnggPSB0aGlzLmRpciAqIC0xO1xuXG5cdFx0Ly8gZWxzZSB0aGlzLmJvZHkudmVsb2NpdHkueCA9IDA7XG5cblx0XHQvLyB0aGlzLndlYXBvbi51cGRhdGUodGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmFuZ2xlVG9YWSh0aGlzLndlYXBvbi5zcHJpdGUsIHgsIHkpKTtcblxuXHRcdC8vIGlmICh0aGlzLmdhbWUubWF0aC5kaXN0YW5jZSh4LCB5LCB0aGlzLnNwcml0ZS54LCB0aGlzLnNwcml0ZS55KSA8IDE1MCkge1xuXHRcdC8vIFx0IXRoaXMuaXNEZWFkICYmIHRoaXMud2VhcG9uLmZpcmUoKTtcblx0XHQvLyB9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFbmVteTtcbiIsImNvbnN0IFdlYXBvbiA9IHJlcXVpcmUoJy4vV2VhcG9uLmpzJyk7XG5jb25zdCBlbnRpdGllcyA9IHJlcXVpcmUoJy4vZW50aXRpZXMuanNvbicpO1xuXG5jbGFzcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSwgaXNXZWFwb24gPSB0cnVlKSB7XG5cdFx0dGhpcy50eXBlID0gdHlwZTtcblx0XHR0aGlzLmxldmVsID0gbGV2ZWw7XG5cdFx0dGhpcy5nYW1lID0gbGV2ZWwuZ2FtZTtcblx0XHR0aGlzLl9lbnRpdHkgPSBlbnRpdGllc1t0eXBlXTtcblxuXHRcdHRoaXMueCA9IHggfHwgMDtcblx0XHR0aGlzLnkgPSB5IHx8IDA7XG5cdFx0dGhpcy5zcGVlZCA9IHRoaXMuX2VudGl0eS5zcGVlZCB8fCAxMDA7XG5cdFx0dGhpcy5ocCA9IHRoaXMuX2VudGl0eS5ocCB8fCAxO1xuXHRcdHRoaXMucmFkaXVzVmlzaWJpbGl0eSA9IDEwMDtcblx0XHR0aGlzLmlzSnVtcGluZyA9IGZhbHNlO1xuXHRcdHRoaXMuaXNEZWFkID0gZmFsc2U7XG5cblx0XHR0aGlzLndlYXBvbklkID0gdGhpcy5fZW50aXR5LndlYXBvbiAhPSBudWxsID8gdGhpcy5fZW50aXR5LndlYXBvbiA6ICdndW4nO1xuXHRcdHRoaXMuX2NyZWF0ZVBoYXNlck9iamVjdHMoKTtcblx0fVxuXG5cdF9jcmVhdGVQaGFzZXJPYmplY3RzKCkge1xuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKHRoaXMueCwgdGhpcy55LCB0aGlzLl9lbnRpdHkudGV4dHVyZSk7XG5cdFx0dGhpcy5zcHJpdGUuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMuc3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUuY2xhc3MgPSB0aGlzO1xuXG5cdFx0aWYgKHRoaXMuX2VudGl0eS53ZWFwb24pIHRoaXMud2VhcG9uID0gbmV3IFdlYXBvbih0aGlzLCB0aGlzLndlYXBvbklkKTtcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMuc3ByaXRlKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LmdyYXZpdHkueSA9IDEwMDA7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5kcmFnLnNldCgxNTApO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkubWF4VmVsb2NpdHkuc2V0KDEwMDApO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkud2lkdGggPSAxNjtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LmhlaWdodCA9IDE2O1xuXHRcdHRoaXMuc3ByaXRlLnN5bmNCb3VuZHMgPSB0cnVlO1xuXHR9XG5cblx0X3VwZGF0ZSgpIHtcblx0XHRpZiAodGhpcy5pc0RlYWQpIHJldHVybjtcblxuXHRcdC8vIGNvbGxpc2lvbiBwZXJzb24gd2l0aCBidWxsZXRzXG5cdFx0bGV0IGJ1bGxldHMgPSB0aGlzLmxldmVsLmJ1bGxldHMuY2hpbGRyZW47XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBidWxsZXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdHRoaXMuY29uc3RydWN0b3IubmFtZSA9PT0gYnVsbGV0c1tpXS50eXBlT3duZXIgfHxcblx0XHRcdFx0KHRoaXMuY29uc3RydWN0b3IubmFtZSA9PT0gJ1NsYXZlJyAmJiBidWxsZXRzW2ldLnR5cGVPd25lciA9PT0gJ1BsYXllcicpXG5cdFx0XHQpXG5cdFx0XHRcdGNvbnRpbnVlO1xuXG5cdFx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAoYnVsbGV0c1tpXSwgdGhpcy5zcHJpdGUsIChwZXJzb24sIGJ1bGxldCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggKz0gTWF0aC5jb3ModGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSArPSBNYXRoLnNpbih0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDtcblx0XHRcdFx0dGhpcy5ocC0tO1xuXHRcdFx0XHRpZiAodGhpcy5ocCA9PT0gMCkgdGhpcy5kZWFkKGJ1bGxldC5yb3RhdGlvbik7XG5cdFx0XHRcdGJ1bGxldC5raWxsKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBleHRlbmRzIHVwZGF0ZSFcblx0XHR0aGlzLnVwZGF0ZSAmJiB0aGlzLnVwZGF0ZSgpO1xuXHR9XG5cblx0ZGVhZChyb3RhdGlvbikge1xuXHRcdHRoaXMuaXNEZWFkID0gdHJ1ZTtcblx0XHR0aGlzLm9uRGVhZCAmJiB0aGlzLm9uRGVhZChyb3RhdGlvbik7XG5cdFx0dGhpcy5zcHJpdGUua2lsbCgpO1xuXHRcdGlmICh0aGlzLndlYXBvbikge1xuXHRcdFx0dGhpcy53ZWFwb24uc3ByaXRlLmtpbGwoKTtcblx0XHRcdHRoaXMud2VhcG9uLndlYXBvbi5kZXN0cm95KCk7XG5cdFx0fVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuIiwiY2xhc3MgRmlyZSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5LCB0eXBlID0gJ2ZpcmUnKSB7XG5cdFx0dGhpcy5ocCA9IDE7XG5cdFx0dGhpcy5sZXZlbCA9IGxldmVsO1xuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKHgsIHksICdmaXJlX2JsdWUnLCAxKTtcblx0XHRjb25zdCBhbmltID0gdGhpcy5zcHJpdGUuYW5pbWF0aW9ucy5hZGQoJ2RlZmF1bHQnKTtcblx0XHRhbmltLnBsYXkoMTAsIHRydWUpO1xuXG5cdFx0dGhpcy5zcHJpdGUuYW5jaG9yLnNldCgxLCAwLjUpO1xuXHRcdHRoaXMuc3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUuY2xhc3MgPSB0aGlzO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMuc3ByaXRlKTtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnBsYXllci5zcHJpdGUsIChfLCBwbCkgPT4gcGwuY2xhc3MuZGVhZCgpKTtcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuZW5lbWllcywgKF8sIGVuKSA9PiB7XG5cdFx0XHRpZiAoZW4uY2xhc3MudHlwZSA9PT0gJ3NsYXZlJykge1xuXHRcdFx0XHRlbi5jbGFzcy5kZWFkKCk7XG5cdFx0XHRcdHRoaXMuc3ByaXRlLmtpbGwoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpcmU7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuL0VudGl0eScpO1xuXG5jbGFzcyBGbHkgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSkge1xuXHRcdHN1cGVyKGxldmVsLCB4LCB5LCBNYXRoLnJhbmRvbSgpIDwgMC41ID8gJ2dsdXonIDogJ2NoaXJpcGFraGEnKTtcblx0XHR0aGlzLnN0YXJ0ID0gW3gsIHldO1xuXHRcdHRoaXMuYXR0YWNrTW9kZSA9IHRydWU7XG5cdFx0dGhpcy50aW1lciA9IDA7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdHRoaXMubGV2ZWwuZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKTtcblx0XHR0aGlzLmxldmVsLmRyb3BPcmdhbih4LCB5LCByb3RhdGlvbik7XG5cdFx0dGhpcy5sZXZlbC5kcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pO1xuXHRcdC8vY29uc29sZS5sb2coJ0RFQUQhJyk7XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR0YXJnZXRFbmVteSh4LCB5KSB7XG5cdFx0Y29uc3Qgc2xhdmVzID0gdGhpcy5sZXZlbC5lbmVtaWVzLmNoaWxkcmVuLmZpbHRlcihlID0+IGUuY2xhc3MudHlwZSA9PT0gJ3NsYXZlJyAmJiAhZS5jbGFzcy5pc0RlYWQpO1xuXHRcdGNvbnN0IHNsYXZlID0gc2xhdmVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNsYXZlcy5sZW5ndGgpXTtcblx0XHR0aGlzLnRyYWNrID0gc2xhdmUgPyBzbGF2ZS5zcHJpdGUgOiB0aGlzLmxldmVsLnBsYXllci5zcHJpdGU7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNrIHx8IHRoaXMudHJhY2suY2xhc3MuaXNEZWFkKSByZXR1cm4gdGhpcy50YXJnZXRFbmVteSgpO1xuXHRcdGlmICh0aGlzLmxldmVsLmdhbWUubWF0aC5kaXN0YW5jZSh0aGlzLnRyYWNrLngsIHRoaXMudHJhY2sueSwgdGhpcy5zcHJpdGUueCwgdGhpcy5zcHJpdGUueSkgPiAzMDApIHtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnggPSB0aGlzLnN0YXJ0WzBdO1xuXHRcdFx0dGhpcy5zcHJpdGUucG9zaXRpb24ueSA9IHRoaXMuc3RhcnRbMV07XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMudGltZXIgPiAxMDApIHtcblx0XHRcdHRoaXMudGltZXIgPSAwO1xuXHRcdFx0dGhpcy5hdHRhY2tNb2RlID0gdHJ1ZTtcblx0XHR9IGVsc2UgdGhpcy50aW1lcisrO1xuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLmF0dGFja01vZGUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHBsLmNsYXNzLmRlYWQoKSk7XG5cdFx0Y29uc3QgYW5nbGUgPSB0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm1vdmVUb1hZKFxuXHRcdFx0dGhpcy5zcHJpdGUsXG5cdFx0XHR0aGlzLnRyYWNrLngsXG5cdFx0XHR0aGlzLnRyYWNrLnkgLSAodGhpcy5hdHRhY2tNb2RlID8gMCA6IDEyMCksXG5cdFx0XHR0aGlzLnNwZWVkXG5cdFx0KTtcblxuXHRcdC8vIGJ1bGxldHNcblx0XHRsZXQgYnVsbGV0cyA9IHRoaXMubGV2ZWwuYnVsbGV0cy5jaGlsZHJlbjtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJ1bGxldHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5jb25zdHJ1Y3Rvci5uYW1lID09PSBidWxsZXRzW2ldLnR5cGVPd25lciB8fFxuXHRcdFx0XHQodGhpcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2xhdmUnICYmIGJ1bGxldHNbaV0udHlwZU93bmVyID09PSAnUGxheWVyJylcblx0XHRcdClcblx0XHRcdFx0Y29udGludWU7XG5cblx0XHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChidWxsZXRzW2ldLCB0aGlzLnNwcml0ZSwgKHBlcnNvbiwgYnVsbGV0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCArPSBNYXRoLmNvcyh0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ICs9IE1hdGguc2luKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLmRlYWQoYnVsbGV0LnJvdGF0aW9uKTtcblx0XHRcdFx0YnVsbGV0LmtpbGwoKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Ly8gY29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdC8vIGlmIChyaWdodFRpbGUpIHRoaXMuZGlyID0gLTE7XG5cdFx0Ly8gaWYgKGxlZnRUaWxlKSB0aGlzLmRpciA9IDE7XG5cdFx0Ly8gdGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gODAgKiB0aGlzLmRpcjtcblx0XHQvLyB0aGlzLnNwcml0ZS5zY2FsZS54ID0gdGhpcy5kaXIgKiAtMTtcblxuXHRcdC8vIGVsc2UgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSAwO1xuXG5cdFx0Ly8gdGhpcy53ZWFwb24udXBkYXRlKHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZVRvWFkodGhpcy53ZWFwb24uc3ByaXRlLCB4LCB5KSk7XG5cblx0XHQvLyBpZiAodGhpcy5nYW1lLm1hdGguZGlzdGFuY2UoeCwgeSwgdGhpcy5zcHJpdGUueCwgdGhpcy5zcHJpdGUueSkgPCAxNTApIHtcblx0XHQvLyBcdCF0aGlzLmlzRGVhZCAmJiB0aGlzLndlYXBvbi5maXJlKCk7XG5cdFx0Ly8gfVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmx5O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHkuanMnKTtcbmNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNsYXNzIFBsYXllciBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5KSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksICdwbGF5ZXInKTtcblx0XHR0aGlzLm9yZ2FucyA9IFtdO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdGlmICh0aGlzLnNwcml0ZS55ID4gMzAwKSB7XG5cdFx0XHR0aGlzLmRlYWQoKTtcblx0XHR9XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuc29saWRzKTtcblxuXHRcdHRoaXMuc3ByaXRlLnNjYWxlLnggPSB0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPCAwID8gLTEgOiAxO1xuXHRcdGNvbnN0IGFuZ2xlID0gdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmFuZ2xlVG9Qb2ludGVyKHRoaXMud2VhcG9uLnNwcml0ZSk7XG5cdFx0aWYgKGFuZ2xlIDwgLTEuOCB8fCBhbmdsZSA+IDEuNCkgdGhpcy5zcHJpdGUuc2NhbGUueCA9IC0xO1xuXHRcdGVsc2UgdGhpcy5zcHJpdGUuc2NhbGUueCA9IDE7XG5cblx0XHR0aGlzLndlYXBvbi51cGRhdGUoYW5nbGUpO1xuXG5cdFx0Ly8gSXRlbXMgdXNlXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLml0ZW1zLCAoc3ByaXRlLCBpdGVtKSA9PiB7XG5cdFx0XHRpdGVtLmtpbGwoKTtcblx0XHRcdHRoaXMub3JnYW5zLnB1c2goaXRlbS50eXBlKTtcblx0XHRcdFVJLm9yZ2FucysrO1xuXHRcdFx0dGhpcy5sZXZlbC5hZGRTbGF2ZSh0aGlzLnNwcml0ZS5wb3NpdGlvbi54LCB0aGlzLnNwcml0ZS5wb3NpdGlvbi55KTtcblx0XHR9KTtcblx0fVxuXG5cdG9uV291bmRlZCgpIHt9XG5cblx0b25EZWFkKCkge1xuXHRcdFVJLmlzRGVhZCA9IHRydWU7XG5cdFx0dGhpcy5sZXZlbC5yZXN0cnVjdFNsYXZlcygpO1xuXHRcdHRoaXMubGV2ZWwuc3RhdGUuc3RhcnQoJ0hvbWUnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4vRW50aXR5LmpzJyk7XG5cbmNsYXNzIFNsYXZlIGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIGluZGV4LCBsaW1pdCkge1xuXHRcdHN1cGVyKGxldmVsLCB4LCB5LCAnc2xhdmUnLCBmYWxzZSk7XG5cdFx0dGhpcy5pbmRleCA9IGluZGV4O1xuXHRcdHRoaXMubGltaXQgPSBsaW1pdDtcblx0XHR0aGlzLnN0b3BNb3ZlID0gZmFsc2U7XG5cdFx0dGhpcy5ub3RBY3RpdmUgPSBmYWxzZTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3ByaXRlLnkgPiAzMDApIHtcblx0XHRcdHRoaXMuZGVhZCgpO1xuICAgICAgICB9XG5cblx0XHRpZiAodGhpcy5zcHJpdGUuaXNNYWluSGVybykgdGhpcy5ub3RBY3RpdmUgPSB0cnVlO1xuXHRcdGlmICh0aGlzLm5vdEFjdGl2ZSkge1xuXHRcdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnBsYXllci5zcHJpdGUsICgpID0+IHtcblx0XHRcdFx0dGhpcy5ub3RBY3RpdmUgPSBmYWxzZTtcblx0XHRcdFx0dGhpcy5pbmRleCA9IHRoaXMubGV2ZWwuY29udHJvbHMubGVuZ3RoIC0gdGhpcy5saW1pdDtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5zb2xpZHMpO1xuXHRcdGlmICh0aGlzLm5vdEFjdGl2ZSB8fCB0aGlzLnNwcml0ZS5pc01haW5IZXJvIHx8ICF0aGlzLmxldmVsLmlzUGxheWVyTWFpbikgcmV0dXJuO1xuXG5cdFx0Ly8gY29uc3QgeyB4LCB5IH0gPSB0aGlzLmxldmVsLm1haW5IZXJvLnBvc2l0aW9uO1xuXHRcdC8vIGNvbnN0IHZlbFggPSB0aGlzLmxldmVsLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueDtcblx0XHQvL2lmICghdmVsWCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgW3gsIHksIGlzR3JvdWRdID0gdGhpcy5sZXZlbC5jb250cm9sc1t0aGlzLmluZGV4XTtcblx0XHRpZiAoIXRoaXMuc3RvcE1vdmUpIHtcblx0XHRcdHRoaXMuc3ByaXRlLnNjYWxlLnggPSB4IC0gdGhpcy5zcHJpdGUucG9zaXRpb24ueCA8IDAgPyAtMSA6IDE7XG5cdFx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi54ID0geDtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnkgPSB5O1xuXHRcdH1cblxuXHRcdGlmICghaXNHcm91ZCB8fCB0aGlzLmluZGV4IDwgdGhpcy5sZXZlbC5jb250cm9scy5sZW5ndGggLSB0aGlzLmxpbWl0KSB7XG5cdFx0XHRpZiAodGhpcy5pbmRleCA8IHRoaXMubGV2ZWwuY29udHJvbHMubGVuZ3RoIC0gMSkge1xuXHRcdFx0XHR0aGlzLmluZGV4Kys7XG5cdFx0XHRcdHRoaXMuc3RvcE1vdmUgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB0aGlzLnN0b3BNb3ZlID0gdHJ1ZTtcblx0XHR9IGVsc2UgdGhpcy5zdG9wTW92ZSA9IHRydWU7XG5cblx0XHQvLyBjb25zdCByaWdodFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54ICsgMTYsIHRoaXMuc3ByaXRlLnkpIHx8IHt9O1xuXHRcdC8vIGNvbnN0IGxlZnRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55KSB8fCB7fTtcblx0XHQvLyBjb25zdCBkb3duTGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54ICsgMTYsIHRoaXMuc3ByaXRlLnkgKyAxNik7XG5cdFx0Ly8gY29uc3QgZG93blJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggLSAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblxuXHRcdC8vIGlmICh0aGlzLnNwcml0ZS5ib2R5Lm9uRmxvb3IoKSkge1xuXHRcdC8vIFx0aWYgKCFkb3duTGVmdFRpbGUgfHwgbGVmdFRpbGUuY2FuQ29sbGlkZSkge1xuXHRcdC8vIFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgPSAtNDAwO1xuXHRcdC8vIFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPSAtMTUwO1xuXHRcdC8vIFx0fVxuXHRcdC8vIFx0aWYgKCFkb3duUmlnaHRUaWxlIHx8IHJpZ2h0VGlsZS5jYW5Db2xsaWRlKSB7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IDE1MDtcblx0XHQvLyBcdH1cblx0XHQvLyB9XG5cblx0XHQvLyB0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggPSB2ZWxYO1xuXG5cdFx0Ly8gaWYgKHRoaXMuanVtcEJ1dHRvbi5pc0Rvd24gJiYgdGhpcy5zcHJpdGUuYm9keS5vbkZsb29yKCkgJiYgdGhpcy5nYW1lLnRpbWUubm93ID4gdGhpcy5qdW1wVGltZXIpIHtcblx0XHQvLyBcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSA9IC0xMDAwO1xuXHRcdC8vIFx0dGhpcy5qdW1wVGltZXIgPSB0aGlzLmdhbWUudGltZS5ub3cgKyA1MDA7XG5cdFx0Ly8gfVxuXHR9XG5cblx0b25EZWFkKCkge1xuXHRcdGlmICh0aGlzLnNwcml0ZS5pc01haW5IZXJvKSB0aGlzLmxldmVsLnN3YXBIZXJvKHRydWUpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2xhdmU7XG4iLCJjb25zdCB3ZWFwb25zID0gcmVxdWlyZSgnLi93ZWFwb25zLmpzb24nKTtcblxuY2xhc3MgV2VhcG9uIHtcblx0Y29uc3RydWN0b3IocGVyc29uLCB0eXBlKSB7XG5cdFx0dGhpcy5sZXZlbCA9IHBlcnNvbi5sZXZlbDtcblx0XHR0aGlzLmdhbWUgPSB0aGlzLmxldmVsLmdhbWU7XG5cdFx0dGhpcy5wZXJzb24gPSBwZXJzb247XG5cblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSgwLCAwLCAnZ3VuJyk7XG5cdFx0dGhpcy5zcHJpdGUuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMuc3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLl93ZWFwb25zID0gd2VhcG9uc1t0eXBlXTtcblx0XHR0aGlzLmlkID0gdGhpcy5fd2VhcG9ucy5pZCAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5pZCA6IDA7XG5cdFx0dGhpcy50cmFja1ggPSB0aGlzLl93ZWFwb25zLnRyYWNrWCAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy50cmFja1ggOiAxNjtcblx0XHR0aGlzLnRyYWNrWSA9IHRoaXMuX3dlYXBvbnMudHJhY2tZICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLnRyYWNrWSA6IDQ7XG5cdFx0dGhpcy5zcGVlZCA9IHRoaXMuX3dlYXBvbnMuc3BlZWQgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMuc3BlZWQgOiAxMDA7XG5cdFx0dGhpcy5kYW1hZ2UgPSB0aGlzLl93ZWFwb25zLmRhbWFnZSAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5kYW1hZ2UgOiAxO1xuXHRcdHRoaXMuZGVsYXkgPSB0aGlzLl93ZWFwb25zLmRlbGF5ICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLmRlbGF5IDogMTA7XG5cdFx0dGhpcy5xdWFudGl0eSA9IHRoaXMuX3dlYXBvbnMucXVhbnRpdHkgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMucXVhbnRpdHkgOiAxO1xuXG5cdFx0dGhpcy53ZWFwb24gPSB0aGlzLmxldmVsLmFkZC53ZWFwb24oMTAwLCAnYnVsbGV0JywgbnVsbCwgdGhpcy5sZXZlbC5idWxsZXRzKTtcblx0XHR0aGlzLndlYXBvbi5zZXRCdWxsZXRGcmFtZXModGhpcy5pZCwgdGhpcy5pZCwgdHJ1ZSk7XG5cdFx0dGhpcy53ZWFwb24uYnVsbGV0S2lsbFR5cGUgPSBQaGFzZXIuV2VhcG9uLktJTExfV09STERfQk9VTkRTO1xuXHRcdHRoaXMud2VhcG9uLmJ1bGxldFNwZWVkID0gdGhpcy5zcGVlZDtcblx0XHR0aGlzLndlYXBvbi5maXJlUmF0ZSA9IHRoaXMuZGVsYXk7XG5cdFx0dGhpcy53ZWFwb24uYnVsbGV0cy50eXBlT3duZXIgPSB0aGlzLnBlcnNvbi5jb25zdHJ1Y3Rvci5uYW1lO1xuXG5cdFx0dGhpcy53ZWFwb24udHJhY2tTcHJpdGUodGhpcy5wZXJzb24uc3ByaXRlKTtcblx0fVxuXG5cdHVwZGF0ZVRyYWNrKHgsIHkpIHtcblx0XHR0aGlzLnNwcml0ZS5hbmdsZSA9IHRoaXMubGV2ZWwuZ2FtZS5hbmdsZUJldHdlZW4odGhpcy5zcHJpdGUpO1xuXHR9XG5cblx0ZmlyZSh4LCB5KSB7XG5cdFx0bGV0IGJ1bGxldCA9IHRoaXMud2VhcG9uLmZpcmUoKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0XHQvLyBpZiAoYnVsbGV0KSB7XG5cdFx0Ly8gXHR0aGlzLnBlcnNvbi5zcHJpdGUuYm9keS52ZWxvY2l0eS54IC09IE1hdGguY29zKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwMDtcblx0XHQvLyBcdHRoaXMucGVyc29uLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgLT0gTWF0aC5zaW4odGhpcy5zcHJpdGUucm90YXRpb24pICogMTAwO1xuXHRcdC8vIFx0cmV0dXJuIHRydWU7XG5cdFx0Ly8gfVxuXHR9XG5cdHVwZGF0ZShhbmdsZSkge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5wZXJzb24uc3ByaXRlLnBvc2l0aW9uO1xuXHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnNldCh4LCB5ICsgMyk7XG5cdFx0dGhpcy5zcHJpdGUucm90YXRpb24gPSBhbmdsZTtcblx0XHR0aGlzLndlYXBvbi5maXJlQW5nbGUgPSB0aGlzLmdhbWUubWF0aC5yYWRUb0RlZyhhbmdsZSk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy53ZWFwb24uYnVsbGV0cywgdGhpcy5sZXZlbC5zb2xpZHMsIChidWxsZXQsIHRpbGUpID0+IHtcblx0XHRcdGJ1bGxldC5raWxsKCk7XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXZWFwb247XG4iLCJtb2R1bGUuZXhwb3J0cz17XG5cdFwicGxheWVyXCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJwbGF5ZXJcIixcblx0XHRcImp1bXBcIjogMyxcblx0XHRcInNwZWVkXCI6IDEwMCxcblx0XHRcImhwXCI6IDEsXG5cdFx0XCJ3ZWFwb25cIjogXCJndW5cIlxuXHR9LFxuXHRcInNsYXZlXCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJ6b21iaVwiLFxuXHRcdFwianVtcFwiOiAzLFxuXHRcdFwic3BlZWRcIjogMTAwLFxuXHRcdFwiaHBcIjogMSxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH0sXG5cdFwiZW5lbXlcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcImRlbW9uXCIsXG5cdFx0XCJqdW1wXCI6IDMsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJocFwiOiAxLFxuXHRcdFwicmFkaXVzVmlzaWJpbGl0eVwiOiAxNTAsXG5cdFx0XCJ3ZWFwb25cIjogXCJcIlxuXHR9LFxuXHRcImdsdXpcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcImdsdXpcIixcblx0XHRcInNwZWVkXCI6IDcwLFxuXHRcdFwiaHBcIjogMixcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH0sXG5cdFwiY2hpcmlwYWtoYVwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwiY2hpcmlwYWtoYVwiLFxuXHRcdFwic3BlZWRcIjogMTAwLFxuXHRcdFwiaHBcIjogMSxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJndW5cIjoge1xuXHRcdFwiaWRcIjogMSxcblx0XHRcInJhbmdlXCI6IDEwMCxcblx0XHRcInNwZWVkXCI6IDQwMCxcblx0XHRcImRhbWFnZVwiOiAxMCxcblx0XHRcImRlbGF5XCI6IDQwMCxcblx0XHRcInF1YW50aXR5XCI6IDEwLFxuXHRcdFwidHJhY2tYXCI6IDEsXG5cdFx0XCJ0cmFja1lcIjogMVxuXHR9XG59XG4iLCJjb25zdCBCb290ID0gcmVxdWlyZSgnLi9zdGF0ZXMvQm9vdC5qcycpO1xuY29uc3QgUHJlbG9hZCA9IHJlcXVpcmUoJy4vc3RhdGVzL1ByZWxvYWQuanMnKTtcbmNvbnN0IE1lbnUgPSByZXF1aXJlKCcuL3N0YXRlcy9NZW51LmpzJyk7XG5jb25zdCBMZXZlbCA9IHJlcXVpcmUoJy4vc3RhdGVzL0xldmVsLmpzJyk7XG5jb25zdCBIb21lID0gcmVxdWlyZSgnLi9zdGF0ZXMvSG9tZS5qcycpO1xuXG52YXIgcmVhZHkgPSAoKSA9PiB7XG5cdHZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDQ4MCwgMTQgKiAxNiwgUGhhc2VyLkFVVE8sICdTaG9vdGVyQmxpbmsnKTtcblxuXHRnYW1lLnN0YXRlLmFkZCgnTWVudScsIE1lbnUpO1xuXHRnYW1lLnN0YXRlLmFkZCgnSG9tZScsIEhvbWUpO1xuXHRnYW1lLnN0YXRlLmFkZCgnTGV2ZWwnLCBMZXZlbCk7XG5cdGdhbWUuc3RhdGUuYWRkKCdQcmVsb2FkJywgUHJlbG9hZCk7XG5cdGdhbWUuc3RhdGUuYWRkKCdCb290JywgQm9vdCwgdHJ1ZSk7XG59O1xuXG5yZWFkeSgpO1xuIiwidmFyIFVJID0ge1xuXHRsZXZlbDogMSxcblx0YnVsbGV0czogMTAsXG5cdG9yZ2FuczogMCxcblx0aXNEZWFkOiB0cnVlLFxuXG5cdGFkZFRleHRCdXR0b246ICh4ID0gMCwgeSA9IDAsIHRleHQsIHRleHRGYW1pbHksIGZvbnRTaXplID0gMzAsIGNiKSA9PiB7XG5cdFx0bGV0IHR4dCA9IFVJLmFkZFRleHQoeCwgeSwgdGV4dCwgdGV4dEZhbWlseSwgZm9udFNpemUpO1xuXHRcdFVJLnNldEJ1dHRvbih0eHQsIGNiKTtcblx0XHRyZXR1cm4gdHh0O1xuXHR9LFxuXG5cdGFkZFRleHQ6ICh4ID0gMCwgeSA9IDAsIHRleHQsIHRleHRGYW1pbHksIGZvbnRTaXplID0gMzAsIGZpbGwgPSAnI2ZmZicpID0+IHtcblx0XHRsZXQgdHh0ID0gVUkuZ2FtZS5hZGQudGV4dCh4LCB5LCB0ZXh0LCB7IHRleHRGYW1pbHksIGZvbnRTaXplLCBmaWxsIH0pO1xuXHRcdHR4dC5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHR4dC5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0cmV0dXJuIHR4dDtcblx0fSxcblxuXHRhZGRJY29uQnV0dG9uOiAoeCA9IDAsIHkgPSAwLCBrZXksIGluZGV4LCBjYikgPT4ge1xuXHRcdGxldCBzcHJpdGUgPSBVSS5nYW1lLmFkZC5zcHJpdGUoeCwgeSwga2V5LCBpbmRleCk7XG5cdFx0c3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cdFx0c3ByaXRlLnNjYWxlLnNldCgxLjUpO1xuXHRcdFVJLnNldEJ1dHRvbihzcHJpdGUsIGNiKTtcblx0XHRyZXR1cm4gc3ByaXRlO1xuXHR9LFxuXG5cdHNldEJ1dHRvbjogKG9iaiwgY2IpID0+IHtcblx0XHRvYmouaW5wdXRFbmFibGVkID0gdHJ1ZTtcblx0XHRsZXQgeCA9IG9iai5zY2FsZS54O1xuXHRcdGxldCB5ID0gb2JqLnNjYWxlLnk7XG5cblx0XHRvYmouZXZlbnRzLm9uSW5wdXREb3duLmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdFVJLmdhbWUuYWRkXG5cdFx0XHRcdC50d2VlbihvYmouc2NhbGUpXG5cdFx0XHRcdC50byh7IHg6IHggKyAwLjMsIHk6IHkgKyAwLjMgfSwgMzAwKVxuXHRcdFx0XHQuc3RhcnQoKTtcblx0XHR9KTtcblx0XHRvYmouZXZlbnRzLm9uSW5wdXRVcC5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKG9iai5kaXNhYmxlKSByZXR1cm47XG5cdFx0XHRjYigpO1xuXHRcdH0pO1xuXHRcdG9iai5ldmVudHMub25JbnB1dE92ZXIuYWRkKCgpID0+IHtcblx0XHRcdGlmIChvYmouZGlzYWJsZSkgcmV0dXJuO1xuXHRcdFx0VUkuZ2FtZS5hZGRcblx0XHRcdFx0LnR3ZWVuKG9iai5zY2FsZSlcblx0XHRcdFx0LnRvKHsgeDogeCArIDAuMywgeTogeSArIDAuMyB9LCAzMDApXG5cdFx0XHRcdC5zdGFydCgpO1xuXHRcdH0pO1xuXHRcdG9iai5ldmVudHMub25JbnB1dE91dC5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKG9iai5kaXNhYmxlKSByZXR1cm47XG5cdFx0XHRVSS5nYW1lLmFkZFxuXHRcdFx0XHQudHdlZW4ob2JqLnNjYWxlKVxuXHRcdFx0XHQudG8oeyB4OiB4LCB5OiB5IH0sIDMwMClcblx0XHRcdFx0LnN0YXJ0KCk7XG5cdFx0fSk7XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVUk7XG4iLCJjb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSScpO1xuXG5jbGFzcyBCb290IHtcblx0aW5pdCgpIHtcblx0XHR0aGlzLncgPSA0ODA7XG5cdFx0dGhpcy5oID0gMTUgKiAxNjtcblx0XHRVSS5nYW1lID0gdGhpcy5nYW1lO1xuXHR9XG5cblx0Y3JlYXRlKCkge1xuXHRcdHRoaXMuc2NhbGUuc2NhbGVNb2RlID0gUGhhc2VyLlNjYWxlTWFuYWdlci5TSE9XX0FMTDtcblx0XHR0aGlzLnNjYWxlLmZ1bGxTY3JlZW5TY2FsZU1vZGUgPSBQaGFzZXIuU2NhbGVNYW5hZ2VyLkVYQUNUX0ZJVDtcblx0XHR0aGlzLnNjYWxlLnBhZ2VBbGlnbkhvcml6b250YWxseSA9IHRydWU7XG5cdFx0dGhpcy5zY2FsZS5wYWdlQWxpZ25WZXJ0aWNhbGx5ID0gdHJ1ZTtcblx0XHR0aGlzLnNjYWxlLnNldE1heGltdW0oKTtcblxuXHRcdHRoaXMuZ2FtZS5yZW5kZXJlci5yZW5kZXJTZXNzaW9uLnJvdW5kUGl4ZWxzID0gdHJ1ZTtcblx0XHRQaGFzZXIuQ2FudmFzLnNldEltYWdlUmVuZGVyaW5nQ3Jpc3AodGhpcy5nYW1lLmNhbnZhcyk7XG5cblx0XHR0aGlzLnN0YXRlLnN0YXJ0KCdQcmVsb2FkJyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCb290O1xuIiwiY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUkuanMnKTtcblxuY29uc3QgTElWRVIgPSAncGVjaGVuJztcbmNvbnN0IEhFQVJUID0gJ3NlcmRlY2hrbyc7XG5jb25zdCBTVE9NQUNIID0gJ3poZWx1ZG9rJztcbmNvbnN0IEJSQUlOID0gJ21vemcnO1xuXG5jbGFzcyBIb21lIHtcblx0Y3JlYXRlKCkge1xuXHRcdHRoaXMud29ybGQuc2V0Qm91bmRzKDAsIDAsIDQ4MCwgMzIwKTtcblx0XHR0aGlzLnNjcmVlbiA9IHRoaXMuYWRkLnNwcml0ZSgwLCAwLCAnc2NyZWVuJyk7XG5cdFx0dGhpcy5zY3JlZW4uc2NhbGUuc2V0KDIpO1xuXHRcdHRoaXMuc2NyZWVuLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zY3JlZW4uYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMuc2NyZWVuLnggPSA0ODAgLyAyO1xuXHRcdHRoaXMuc2NyZWVuLnkgPSAyNDAgLyAyO1xuXG5cdFx0dGhpcy5wYXRyeSA9IHRoaXMuYWRkLnNwcml0ZSgwLCAwLCAncGF0cnknKTtcblx0XHR0aGlzLnBhdHJ5LnNjYWxlLnNldCgyKTtcblx0XHR0aGlzLnBhdHJ5LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5wYXRyeS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5wYXRyeS54ID0gNDgwIC8gMiAtIDgwO1xuXHRcdHRoaXMucGF0cnkueSA9IDI0MCAvIDI7XG5cblx0XHR0aGlzLnBheSA9IHRoaXMuYWRkLnNwcml0ZSgwLCAwLCAncGF5Jyk7XG5cdFx0dGhpcy5wYXkuc2NhbGUuc2V0KDIpO1xuXHRcdHRoaXMucGF5LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5wYXkuYW5jaG9yLnNldCgwLjUpO1xuXHRcdHRoaXMucGF5LnggPSA0ODAgLyAyICsgODA7XG5cdFx0dGhpcy5wYXkueSA9IDI0MCAvIDI7XG5cdFx0dGhpcy5wYXkuaW5wdXRFbmFibGVkID0gdHJ1ZTtcblx0XHR0aGlzLnBheS5ldmVudHMub25JbnB1dFVwLmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAoIVVJLm9yZ2FucykgcmV0dXJuO1xuXHRcdFx0VUkub3JnYW5zIC09IDE7XG5cdFx0XHRVSS5idWxsZXRzICs9IDI7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnN0YXJ0ID0gdGhpcy5hZGQuc3ByaXRlKDAsIDAsICdzdGFydCcpO1xuXHRcdHRoaXMuc3RhcnQuc2NhbGUuc2V0KDIpO1xuXHRcdHRoaXMuc3RhcnQuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLnN0YXJ0LmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnN0YXJ0LnggPSA0ODAgLyAyICsgODA7XG5cdFx0dGhpcy5zdGFydC55ID0gMjQwIC8gMiArIDUwO1xuXHRcdHRoaXMuc3RhcnQuaW5wdXRFbmFibGVkID0gdHJ1ZTtcblx0XHR0aGlzLnN0YXJ0LmV2ZW50cy5vbklucHV0VXAuYWRkKCgpID0+IHtcblx0XHRcdHRoaXMuc3RhdGUuc3RhcnQoJ0xldmVsJyk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBuZXdzID0gWyfQpdCw0LrQsNGC0L7QvSDQvtGCIERURiEg0KHQvtCx0LjRgNCw0LnRgtC1INC60L7QvNCw0L3QtNGDISddO1xuXHRcdGNvbnN0IHRleHQgPSBuZXdzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG5ld3MubGVuZ3RoKV07XG5cdFx0VUkuYWRkVGV4dCgxMTAsIDQ4LCB0ZXh0LCAnQXJpYWwnLCAxNCwgJyMwMDAnKS5hbmNob3Iuc2V0KDAsIDApO1xuXG5cdFx0Ly9VSS5hZGRUZXh0KDE0MCwgMTIwLCAn0JzQsNCz0LDQt9C40L0nLCAnQXJpYWwnLCAxNCwgJyMwMDAnKTtcblxuXHRcdC8vVUkuYWRkVGV4dCgxMTAsIDE0MCwgJzIg0L/QsNGC0YDQvtC90YsgPSAxINC+0YDQs9Cw0L0nLCAnQXJpYWwnLCAxNCwgJyMwMDAnKS5hbmNob3Iuc2V0KDAsIDApO1xuXHRcdC8vIFVJLmFkZFRleHRCdXR0b24oMzAwLCAxNDAsICfQntCx0LzQtdC90Y/RgtGMJywgJ0FyaWFsJywgMTQsICgpID0+IHtcblx0XHQvLyBcdGlmICghVUkub3JnYW5zKSByZXR1cm47XG5cdFx0Ly8gXHRVSS5vcmdhbnMgLT0gMTtcblx0XHQvLyBcdFVJLmJ1bGxldHMgKz0gMjtcblx0XHQvLyB9KS5hbmNob3Iuc2V0KDAsIDApO1xuXG5cdFx0Ly8gdGhpcy5iZyA9IHRoaXMuYWRkLnRpbGVTcHJpdGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQsICdiZycpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhdGgxID0gVUkuYWRkVGV4dCgxNjAsIDUwLCAnZm9udCcsICdCTElOSycsIDM1KTtcblx0XHQvLyB0aGlzLmFkZC50d2Vlbih0aGlzLmxhYmVsUGF0aDEpXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAwfSwgMjAwKVxuXHRcdC8vIFx0LnRvKHthbHBoYTogMX0sIDEwMClcblx0XHQvLyBcdC5zdGFydCgpXG5cdFx0Ly8gXHQubG9vcCgpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhcnQyID0gVUkuYWRkVGV4dCgzMjAsIDU1LCAnZm9udCcsICdTSE9PVEVSJywgMjUpO1xuXG5cdFx0Ly8gdGhpcy5idG5TdGFydCA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclktMzUsICdmb250JywgJ1NUQVJUJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ0xldmVsTWFuYWdlcicpO1xuXHRcdC8vIH0pO1xuXHRcdC8vIHRoaXMuYnRuU2V0dGluZ3MgPSBVSS5hZGRUZXh0QnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZKzEwLCAnZm9udCcsICdTRVRUSU5HUycsIDMwLCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdTZXR0aW5ncycpO1xuXHRcdC8vIH0pO1xuXG5cdFx0Ly8gdGhpcy5pbmZvID0gVUkuYWRkVGV4dCgxMCwgNSwgJ2ZvbnQyJywgJ1Bvd2VyZWQgYnkgYXpiYW5nIEB2MC4xJywgMTQpO1xuXHRcdC8vIHRoaXMuaW5mby5hbmNob3Iuc2V0KDApO1xuXG5cdFx0Ly8gVUkuYWRkVGV4dEJ1dHRvbigzMDAsIDIyMCwgJ9Cd0JDQp9CQ0KLQrCA+JywgJ0FyaWFsJywgMTQsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ0xldmVsJyk7XG5cdFx0Ly8gfSkuYW5jaG9yLnNldCgwLCAwKTtcblxuXHRcdGxldCBzdGFydCA9IDEwNTtcblx0XHRsZXQgeSA9IDE4MDtcblx0XHRjb25zdCBtaW5pcGFseWEgPSB0aGlzLmFkZC5zcHJpdGUoc3RhcnQgKyAzMCwgeSwgJ21pbmlwYWx5YScpO1xuXHRcdG1pbmlwYWx5YS5zY2FsZS5zZXQoMik7XG5cdFx0bWluaXBhbHlhLmFuY2hvci5zZXQoMC41KTtcblx0XHRtaW5pcGFseWEuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaXBhbHlhLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5idWxsZXRzVGV4dCA9IFVJLmFkZFRleHQoc3RhcnQgKyAzNCwgeSArIDMsIFVJLmJ1bGxldHMsICdBcmlhbCcsIDE0LCAnIzAwJyk7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblxuXHRcdGNvbnN0IG1pbmltb3pnID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgOTAsIHksICdtaW5pbW96ZycpO1xuXHRcdG1pbmltb3pnLnNjYWxlLnNldCgyKTtcblx0XHRtaW5pbW96Zy5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaW1vemcuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaW1vemcuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgOTQsIHkgKyAzLCAwLCAnQXJpYWwnLCAxNCwgJyNmZjAwMDAnKTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblx0fVxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC50ZXh0ID0gVUkuYnVsbGV0cztcblx0XHR0aGlzLm9yZ2Fuc1RleHQudGV4dCA9IFVJLm9yZ2Fucztcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWU7XG4iLCJjb25zdCBQbGF5ZXIgPSByZXF1aXJlKCcuLi9nYW1lL1BsYXllcicpO1xuY29uc3QgRW5lbXkgPSByZXF1aXJlKCcuLi9nYW1lL0VuZW15Jyk7XG5jb25zdCBTbGF2ZSA9IHJlcXVpcmUoJy4uL2dhbWUvU2xhdmUnKTtcbmNvbnN0IEZpcmUgPSByZXF1aXJlKCcuLi9nYW1lL0ZpcmUnKTtcbmNvbnN0IEZseSA9IHJlcXVpcmUoJy4uL2dhbWUvRmx5Jyk7XG5jb25zdCBEZWF0aCA9IHJlcXVpcmUoJy4uL2dhbWUvRGVhdGgnKTtcblxuY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUknKTtcblxuY29uc3QgTElWRVIgPSAncGVjaGVuJztcbmNvbnN0IEhFQVJUID0gJ3NlcmRlY2hrbyc7XG5jb25zdCBTVE9NQUNIID0gJ3poZWx1ZG9rJztcbmNvbnN0IEJSQUlOID0gJ21vemcnO1xuXG5jbGFzcyBMZXZlbCB7XG5cdGNyZWF0ZSgpIHtcblx0XHRsZXQgbHZsID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMykgKyAxO1xuXHRcdGlmIChVSS5ub3RGaXJzdExldmVsKSB7XG5cdFx0XHQvLyDQodCQ0JzQkNCvINCi0KPQn9CQ0K8g0JPQldCd0JXQoNCQ0KbQmNCvXG5cdFx0XHRpZiAoVUkuaXNEZWFkKSB7XG5cdFx0XHRcdGx2bCA9ICdob21lJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHdoaWxlIChsdmwgPT09IFVJLmxhc3RMdmwpIHtcblx0XHRcdFx0XHRsdmwgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAzKSArIDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0VUkubGFzdEx2bCA9IGx2bDtcblx0XHRcdH1cblxuXHRcdFx0bHZsID0gVUkuaXNEZWFkID8gbHZsIDogJ2xldmVsJyArIGx2bDtcblx0XHRcdFVJLmlzRGVhZCA9IGZhbHNlO1xuXHRcdH0gZWxzZSBsdmwgPSAnbGV2ZWwxJztcblx0XHRVSS5ub3RGaXJzdExldmVsID0gdHJ1ZTtcblxuXHRcdHRoaXMubWFwID0gdGhpcy5nYW1lLmFkZC50aWxlbWFwKGx2bCwgMTYsIDE2KTtcblx0XHR0aGlzLm1hcC5hZGRUaWxlc2V0SW1hZ2UoJ3RpbGVtYXAnKTtcblx0XHQvL1x0dGhpcy5tYXAuZGVidWdNYXAgPSB0cnVlO1xuXG5cdFx0Ly90aGlzLmdhbWUuY2FtZXJhLmJvdW5kcyA9IG51bGw7XG5cdFx0Ly90aGlzLmdhbWUuY2FtZXJhLmJvdW5kcy5zZXRUbygtSW5maW5pdHksIC1JbmZpbml0eSwgSW5maW5pdHksIEluZmluaXR5KTtcblxuXHRcdC8vIEZVQ0tJTkcgUEhBU0VSISBJIEhBVEUgVSBCSVRDSFxuXHRcdHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdiZycpLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDIyNCwgMCwgJ2JnJykuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5nYW1lLmFkZC5zcHJpdGUoMjI0ICogMiwgMCwgJ2JnJykuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCAzMCAqIDE2LCAxMDAgKiAxNik7XG5cdFx0Ly8gdGhpcy5jYW1lcmEuc2V0Qm91bmRzVG9Xb3JsZFx0KCk7XG5cblx0XHR0aGlzLnNvbGlkcyA9IHRoaXMubWFwLmNyZWF0ZUxheWVyKCdzb2xpZHMnKTtcblxuXHRcdHRoaXMuc29saWRzLnJlc2l6ZVdvcmxkKCk7XG5cdFx0dGhpcy5zb2xpZHMuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLm1hcC5zZXRDb2xsaXNpb25CZXR3ZWVuKDAsIDI3MCwgdGhpcy5zb2xpZHMpO1xuXG5cdFx0dGhpcy5kZWNvcnMgPSB0aGlzLm1hcC5jcmVhdGVMYXllcignZGVjb3InKTtcblx0XHR0aGlzLmRlY29ycy5yZXNpemVXb3JsZCgpO1xuXHRcdHRoaXMuZGVjb3JzLnNtb290aGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLmRlY29yczIgPSB0aGlzLm1hcC5jcmVhdGVMYXllcignZGVjb3IyJyk7XG5cdFx0aWYgKHRoaXMuZGVjb3JzMikge1xuXHRcdFx0dGhpcy5kZWNvcnMyLnJlc2l6ZVdvcmxkKCk7XG5cdFx0XHR0aGlzLmRlY29yczIuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBQYXRoRmluZGVyc1xuXHRcdC8vbGV0IGFyciA9IFtdO1xuXHRcdC8vbGV0IHByb3BzID0gdGhpcy5tYXAudGlsZVx0c2V0c1swXS50aWxlUHJvcGVydGllcztcblx0XHQvL2ZvciAobGV0IGkgaW4gcHJvcHMpIHtcblx0XHQvL1x0dGhpcy5tYXAuc2V0Q29sbGlzaW9uKCtpLCB0cnVlLCB0aGlzLmZpcnN0TGF5ZXJNYXApO1xuXHRcdC8vfVxuXHRcdC8vdGhpcy5wYXRoZmluZGVyID0gdGhpcy5nYW1lLnBsdWdpbnMuYWRkKFBoYXNlci5QbHVnaW4uUGF0aEZpbmRlclBsdWdpbik7XG5cdFx0Ly90aGlzLnBhdGhmaW5kZXIuc2V0R3JpZCh0aGlzLm1hcC5sYXllcnNbMF0uZGF0YSwgYXJyKTtcblxuXHRcdC8vIGdyb3VwXG5cdFx0dGhpcy5idWxsZXRzID0gdGhpcy5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLmVuZW1pZXMgPSB0aGlzLmdhbWUuYWRkLmdyb3VwKCk7XG5cdFx0dGhpcy5pdGVtcyA9IHRoaXMuYWRkLmdyb3VwKCk7XG5cdFx0dGhpcy5lbGVtZW50cyA9IHRoaXMuYWRkLmdyb3VwKCk7XG5cdFx0dGhpcy5pdGVtcy5lbmFibGVCb2R5ID0gdHJ1ZTtcblxuXHRcdHRoaXMuc3dhcEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5aKTtcblx0XHR0aGlzLmp1bXBCdXR0b24gPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuVyk7XG5cdFx0dGhpcy5sZWZ0QnV0dG9uID0gdGhpcy5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLkEpO1xuXHRcdHRoaXMucmlnaHRCdXR0b24gPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuRCk7XG5cdFx0dGhpcy5pc1BsYXllck1haW4gPSB0cnVlO1xuXG5cdFx0dGhpcy5kaWZmU2xhdmUgPSAxO1xuXHRcdHRoaXMuc2xhdmVMZWZ0ID0gMDtcblx0XHR0aGlzLnNsYXZlUmlnaHQgPSAwO1xuXG5cdFx0dGhpcy5jb250cm9scyA9IFtdO1xuXG5cdFx0dGhpcy5zd2FwQnV0dG9uLm9uVXAuYWRkKCgpID0+IHRoaXMuc3dhcEhlcm8oKSk7XG5cdFx0dGhpcy5fY3JlYXRlRW5lbWllcygpO1xuXG5cdFx0bGV0IHN0YXJ0ID0gMjA7XG5cdFx0bGV0IHkgPSAyMTA7XG5cdFx0Y29uc3QgbWluaXBhbHlhID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgMzAsIHksICdtaW5pcGFseWEnKTtcblx0XHRtaW5pcGFseWEuc2NhbGUuc2V0KDIpO1xuXHRcdG1pbmlwYWx5YS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaXBhbHlhLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmlwYWx5YS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgMzQsIHkgKyAzLCBVSS5idWxsZXRzLCAnQXJpYWwnLCAxNCwgJyMwMCcpO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cblx0XHRjb25zdCBtaW5pbW96ZyA9IHRoaXMuYWRkLnNwcml0ZShzdGFydCArIDkwLCB5LCAnbWluaW1vemcnKTtcblx0XHRtaW5pbW96Zy5zY2FsZS5zZXQoMik7XG5cdFx0bWluaW1vemcuYW5jaG9yLnNldCgwLjUpO1xuXHRcdG1pbmltb3pnLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmltb3pnLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5vcmdhbnNUZXh0ID0gVUkuYWRkVGV4dChzdGFydCArIDk0LCB5ICsgMywgMCwgJ0FyaWFsJywgMTQsICcjZmYwMDAwJyk7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMub3JnYW5zVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cdH1cblx0X2NyZWF0ZUVuZW1pZXMoKSB7XG5cdFx0dGhpcy5tYXAub2JqZWN0cy5zcGF3biAmJlxuXHRcdFx0dGhpcy5tYXAub2JqZWN0cy5zcGF3bi5mb3JFYWNoKHNwYXduID0+IHtcblx0XHRcdFx0Y29uc3QgYXJncyA9IFtzcGF3bi54ICsgc3Bhd24ud2lkdGggLyAyLCBzcGF3bi55ICsgc3Bhd24uaGVpZ2h0IC8gMiwgc3Bhd24udHlwZSwgc3Bhd24ubmFtZV07XG5cdFx0XHRcdGlmIChzcGF3bi50eXBlID09PSAncGxheWVyJykge1xuXHRcdFx0XHRcdHRoaXMucGxheWVyID0gbmV3IFBsYXllcih0aGlzLCAuLi5hcmdzKTtcblx0XHRcdFx0XHR0aGlzLm1haW5IZXJvID0gdGhpcy5wbGF5ZXIuc3ByaXRlO1xuXHRcdFx0XHRcdHRoaXMuY2FtZXJhLmZvbGxvdyh0aGlzLm1haW5IZXJvLCBQaGFzZXIuQ2FtZXJhLkZPTExPV19QTEFURk9STUVSLCAwLjEsIDAuMSk7XG5cdFx0XHRcdFx0dGhpcy5wbGF5ZXIud2VhcG9uLndlYXBvbi5vbkZpcmUuYWRkKCgpID0+IHtcblx0XHRcdFx0XHRcdFVJLmJ1bGxldHMgLT0gMTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR0aGlzLmNvbnRyb2xzLnB1c2goW2FyZ3NbMF0sIGFyZ3NbMV0sIGZhbHNlXSk7XG5cdFx0XHRcdFx0dGhpcy5zdHJ1Y3RTbGF2ZXMoKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZmlyZScpIHtcblx0XHRcdFx0XHR0aGlzLmVsZW1lbnRzLmFkZChuZXcgRmlyZSh0aGlzLCAuLi5hcmdzKS5zcHJpdGUpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHNwYXduLnR5cGUgPT09ICdmaW5pc2gnKSB7XG5cdFx0XHRcdFx0dGhpcy5maW5pc2ggPSBzcGF3bjtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZmx5Jykge1xuXHRcdFx0XHRcdHRoaXMuZWxlbWVudHMuYWRkKG5ldyBGbHkodGhpcywgLi4uYXJncykuc3ByaXRlKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZGVhdGgnKSB7XG5cdFx0XHRcdFx0dGhpcy5lbGVtZW50cy5hZGQobmV3IERlYXRoKHRoaXMsIC4uLmFyZ3MpLnNwcml0ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2VuZW15Jykge1xuXHRcdFx0XHRcdGxldCBlbmVteSA9IG5ldyBFbmVteSh0aGlzLCAuLi5hcmdzKTtcblx0XHRcdFx0XHR0aGlzLmVuZW1pZXMuYWRkKGVuZW15LnNwcml0ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9XG5cblx0c3dhcEhlcm8obm90U3dhcCkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRjb25zdCBzbGF2ZSA9IHNsYXZlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzbGF2ZXMubGVuZ3RoKV07XG5cdFx0aWYgKCFzbGF2ZSkge1xuXHRcdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gZmFsc2U7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IDA7XG5cdFx0XHR0aGlzLmlzUGxheWVyTWFpbiA9IHRydWU7XG5cdFx0XHR0aGlzLm1haW5IZXJvID0gdGhpcy5wbGF5ZXIuc3ByaXRlO1xuXHRcdFx0dGhpcy5jYW1lcmEuZm9sbG93KHRoaXMubWFpbkhlcm8sIFBoYXNlci5DYW1lcmEuRk9MTE9XX1BMQVRGT1JNRVIsIDAuMSwgMC4xKTtcblx0XHRcdHRoaXMubWFpbkhlcm8uaXNNYWluSGVybyA9IHRydWU7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gZmFsc2U7XG5cdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuXHRcdGlmICghbm90U3dhcCkgdGhpcy5pc1BsYXllck1haW4gPSAhdGhpcy5pc1BsYXllck1haW47XG5cdFx0dGhpcy5tYWluSGVybyA9IHRoaXMuaXNQbGF5ZXJNYWluID8gdGhpcy5wbGF5ZXIuc3ByaXRlIDogc2xhdmU7XG5cdFx0dGhpcy5jYW1lcmEuZm9sbG93KHRoaXMubWFpbkhlcm8sIFBoYXNlci5DYW1lcmEuRk9MTE9XX1BMQVRGT1JNRVIsIDAuMSwgMC4xKTtcblx0XHR0aGlzLm1haW5IZXJvLmlzTWFpbkhlcm8gPSB0cnVlO1xuXHR9XG5cblx0ZHJvcE9yZ2FuKHgsIHksIHJvdGF0aW9uKSB7XG5cdFx0Y29uc3QgdHlwZXMgPSBbTElWRVIsIEhFQVJULCBTVE9NQUNILCBCUkFJTl07XG5cdFx0Y29uc3QgdHlwZSA9IHR5cGVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHR5cGVzLmxlbmd0aCldO1xuXHRcdGNvbnN0IG9yZ2FuID0gdGhpcy5hZGQuc3ByaXRlKHgsIHksIHR5cGUpO1xuXHRcdHRoaXMucGh5c2ljcy5hcmNhZGUuZW5hYmxlKG9yZ2FuKTtcblxuXHRcdG9yZ2FuLmJvZHkuZ3Jhdml0eS55ID0gMTAwMDtcblx0XHRvcmdhbi5ib2R5LnZlbG9jaXR5LnggLT0gdGhpcy5yYW5kb20oLTEwMCwgMTAwKTtcblx0XHRvcmdhbi5ib2R5LnZlbG9jaXR5LnkgLT0gdGhpcy5yYW5kb20oMTAsIDEwMCk7XG5cdFx0b3JnYW4udHlwZSA9IHR5cGU7XG5cdFx0dGhpcy5pdGVtcy5hZGQob3JnYW4pO1xuXHR9XG5cblx0cmFuZG9tKG1pbiwgbWF4KSB7XG5cdFx0cmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIC1taW47XG5cdH1cblxuXHRhZGRTbGF2ZSgpIHtcblx0XHRpZiAoVUkub3JnYW5zIDwgNCkgcmV0dXJuO1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRjb25zdCBpbmRleCA9IE1hdGgubWF4KHRoaXMuY29udHJvbHMubGVuZ3RoIC0gMTAgKiAoc2xhdmVzLmxlbmd0aCArIDEpLCAwKTtcblx0XHRjb25zdCBbeCwgeV0gPSB0aGlzLmNvbnRyb2xzW2luZGV4XTtcblx0XHRsZXQgc2xhdmUgPSBuZXcgU2xhdmUodGhpcywgeCwgeSwgaW5kZXgsIDEwICogKHNsYXZlcy5sZW5ndGggKyAxKSk7XG5cdFx0dGhpcy5lbmVtaWVzLmFkZChzbGF2ZS5zcHJpdGUpO1xuXHRcdFVJLm9yZ2FucyAtPSA0O1xuXHR9XG5cblx0cmVzdHJ1Y3RTbGF2ZXMoKSB7XG5cdFx0Y29uc3Qgc2xhdmVzID0gdGhpcy5lbmVtaWVzLmNoaWxkcmVuLmZpbHRlcihlID0+IGUuY2xhc3MudHlwZSA9PT0gJ3NsYXZlJyAmJiAhZS5jbGFzcy5pc0RlYWQpO1xuXHRcdFVJLm9yZ2FucyArPSBzbGF2ZXMubGVuZ3RoICogNDtcblx0fVxuXG5cdHN0cnVjdFNsYXZlcygpIHtcblx0XHRjb25zdCBzbGF2ZXMgPSBNYXRoLmZsb29yKFVJLm9yZ2FucyAvIDQpO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc2xhdmVzOyBpKyspIHtcblx0XHRcdHRoaXMuYWRkU2xhdmUoKTtcblx0XHR9XG5cdH1cblxuXHR1cGRhdGVDb250cm9sKCkge1xuXHRcdGlmICh0aGlzLmlzUGxheWVyTWFpbiAmJiAodGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggfHwgdGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnkpKVxuXHRcdFx0dGhpcy5jb250cm9scy5wdXNoKFt0aGlzLnBsYXllci5zcHJpdGUueCwgdGhpcy5wbGF5ZXIuc3ByaXRlLnksIHRoaXMubWFpbkhlcm8uYm9keS5vbkZsb29yKCldKTtcblxuXHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54ID0gMDtcblxuXHRcdGlmICh0aGlzLmxlZnRCdXR0b24uaXNEb3duKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueCA9IC0xNTA7XG5cdFx0XHR0aGlzLm1haW5IZXJvLnNjYWxlLnggPSAtMTtcblx0XHR9IGVsc2UgaWYgKHRoaXMucmlnaHRCdXR0b24uaXNEb3duKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueCA9IDE1MDtcblx0XHRcdHRoaXMubWFpbkhlcm8uc2NhbGUueCA9IDE7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmp1bXBCdXR0b24uaXNEb3duICYmIHRoaXMubWFpbkhlcm8uYm9keS5vbkZsb29yKCkpIHtcblx0XHRcdHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS55ID0gLTQwMDtcblx0XHR9XG5cblx0XHRpZiAoVUkuYnVsbGV0cyAmJiB0aGlzLmdhbWUuaW5wdXQubW91c2VQb2ludGVyLmlzRG93biAmJiB0aGlzLmlzUGxheWVyTWFpbiAmJiAhdGhpcy5tYWluSGVyby5jbGFzcy5pc0RlYWQpIHtcblx0XHRcdHRoaXMubWFpbkhlcm8uY2xhc3Mud2VhcG9uLmZpcmUoKTtcblx0XHR9XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC50ZXh0ID0gVUkuYnVsbGV0cztcblx0XHR0aGlzLm9yZ2Fuc1RleHQudGV4dCA9IFVJLm9yZ2FucztcblxuXHRcdHRoaXMucGxheWVyLl91cGRhdGUoKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5lbmVtaWVzLmNoaWxkcmVuW2ldLmNsYXNzLl91cGRhdGUoKTtcblx0XHR9XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnRzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmVsZW1lbnRzLmNoaWxkcmVuW2ldLmNsYXNzLnVwZGF0ZSgpO1xuXHRcdH1cblx0XHR0aGlzLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5pdGVtcywgdGhpcy5zb2xpZHMsIGl0ZW0gPT4gKGl0ZW0uYm9keS52ZWxvY2l0eS54ID0gMCkpO1xuXHRcdHRoaXMudXBkYXRlQ29udHJvbCgpO1xuXG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnBsYXllci5zcHJpdGUucG9zaXRpb247XG5cdFx0Y29uc3QgcmVjdCA9IHRoaXMuZmluaXNoO1xuXHRcdGlmICh4IDwgcmVjdC54ICsgMTYgJiYgeCArIDE2ID4gcmVjdC54ICYmIHkgPCByZWN0LnkgKyAxNiAmJiB5ICsgMTYgPiByZWN0LnkpIHtcblx0XHRcdHRoaXMucmVzdHJ1Y3RTbGF2ZXMoKTtcblx0XHRcdHRoaXMuc3RhdGUucmVzdGFydCgnTGV2ZWwnKTtcblx0XHR9XG5cdFx0Ly90aGlzLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5lbmVtaWVzLCB0aGlzLmVuZW1pZXMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWw7XG4iLCJjb25zdCBVSSA9IHJlcXVpcmUoJy4uL21peGlucy9VSS5qcycpO1xuXG5jbGFzcyBNZW51IHtcblx0Y3JlYXRlKCkge1xuXHRcdHRoaXMud29ybGQuc2V0Qm91bmRzKDAsIDAsIDQ4MCwgMzIwKTtcblx0XHQvLyB0aGlzLmJnID0gdGhpcy5hZGQudGlsZVNwcml0ZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCwgJ2JnJyk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGF0aDEgPSBVSS5hZGRUZXh0KDE2MCwgNTAsICdmb250JywgJ0JMSU5LJywgMzUpO1xuXHRcdC8vIHRoaXMuYWRkLnR3ZWVuKHRoaXMubGFiZWxQYXRoMSlcblx0XHQvLyBcdC50byh7YWxwaGE6IDB9LCAyMDApXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAxfSwgMTAwKVxuXHRcdC8vIFx0LnN0YXJ0KClcblx0XHQvLyBcdC5sb29wKCk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGFydDIgPSBVSS5hZGRUZXh0KDMyMCwgNTUsICdmb250JywgJ1NIT09URVInLCAyNSk7XG5cblx0XHQvLyB0aGlzLmJ0blN0YXJ0ID0gVUkuYWRkVGV4dEJ1dHRvbih0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWS0zNSwgJ2ZvbnQnLCAnU1RBUlQnLCAzMCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWxNYW5hZ2VyJyk7XG5cdFx0Ly8gfSk7XG5cdFx0Ly8gdGhpcy5idG5TZXR0aW5ncyA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclkrMTAsICdmb250JywgJ1NFVFRJTkdTJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ1NldHRpbmdzJyk7XG5cdFx0Ly8gfSk7XG5cblx0XHQvLyB0aGlzLmluZm8gPSBVSS5hZGRUZXh0KDEwLCA1LCAnZm9udDInLCAnUG93ZXJlZCBieSBhemJhbmcgQHYwLjEnLCAxNCk7XG5cdFx0Ly8gdGhpcy5pbmZvLmFuY2hvci5zZXQoMCk7XG5cdH1cblx0dXBkYXRlKCkge31cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZW51O1xuIiwiY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUkuanMnKTtcblxuY2xhc3MgUHJlbG9hZCB7XG5cdHByZWxvYWQoKSB7XG5cdFx0Ly8gTXVzaWNcblx0XHQvLyB0aGlzLmxvYWQuYXVkaW8oXCJtdXNpYzFcIiwgXCIuL2Fzc2V0cy9tdXNpYy90aGVtZS0xLm9nZ1wiKTtcblxuXHRcdC8vIEltYWdlc1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImJnXCIsIFwiLi9hc3NldHMvYmcucG5nXCIpO1xuXG5cdFx0Ly8gIFVJXG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwibGlmZWJveFwiLCBcIi4vYXNzZXRzL1VJL2xpZmVib3gucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImxpZmVyZWN0XCIsIFwiLi9hc3NldHMvVUkvbGlmZXJlY3QucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcIndpbmRvd1wiLCBcIi4vYXNzZXRzL1VJL3dpbmRvdy5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwidmpveV9ib2R5XCIsIFwiLi9hc3NldHMvVUkvYm9keS5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwidmpveV9jYXBcIiwgXCIuL2Fzc2V0cy9VSS9idXR0b24ucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImJ1dHRvbkp1bXBcIiwgXCIuL2Fzc2V0cy9VSS9idXR0b25KdW1wLnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJidXR0b25GaXJlXCIsIFwiLi9hc3NldHMvVUkvYnV0dG9uRmlyZS5wbmdcIik7XG5cblx0XHQvLyBBbmltYXRpb25zXG5cdFx0Ly8gdGhpcy5sb2FkLnNwcml0ZXNoZWV0KFwiZnhfZmlyZVwiLCBcIi4vYXNzZXRzL2FuaW1hdGlvbnMvZmlyZS5wbmdcIiwgMzIsIDMzLCA2KTtcblxuXHRcdC8vIEdhbWUgQXRsYXNlc1xuXHRcdC8vIHRoaXMubG9hZC5hdGxhcyhcblx0XHQvLyBcdFwiYXNzZXRzL1wiLFxuXHRcdC8vIFx0XCJhc3NldHMvYXRsYXNlcy9pdGVtcy5wbmdcIixcblx0XHQvLyBcdFwiYXNzZXRzL2F0bGFzZXMvaXRlbXMuanNvblwiLFxuXHRcdC8vIFx0UGhhc2VyLkxvYWRlci5URVhUVVJFX0FUTEFTX0pTT05fSEFTSFxuXHRcdC8vICk7XG5cblx0XHQvLyBMZXZlbHNcblx0XHR0aGlzLmxvYWQudGlsZW1hcCgnbGV2ZWwxJywgJy4vYXNzZXRzL2xldmVscy9sZXZlbDEuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXHRcdHRoaXMubG9hZC50aWxlbWFwKCdsZXZlbDInLCAnLi9hc3NldHMvbGV2ZWxzL2xldmVsMi5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2xldmVsMycsICcuL2Fzc2V0cy9sZXZlbHMvbGV2ZWwzLmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblx0XHQvL3RoaXMubG9hZC50aWxlbWFwKCdsZXZlbDQnLCAnLi9hc3NldHMvbGV2ZWxzL2xldmVsNS5qc29uJywgbnVsbCwgUGhhc2VyLlRpbGVtYXAuVElMRURfSlNPTik7XG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2hvbWUnLCAnLi9hc3NldHMvbGV2ZWxzL2hvbWUuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXG5cdFx0dGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdmaXJlX2JsdWUnLCAnLi9hc3NldHMvYXRsYXNlcy9maXJlX2JsdWUucG5nJywgMTYsIDE2LCA0KTtcblxuXHRcdHRoaXMubG9hZC5pbWFnZSgndGlsZW1hcCcsICcuL2Fzc2V0cy9hdGxhc2VzL3RpbGVtYXAucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdiZycsICcuL2Fzc2V0cy9hdGxhc2VzL2Zvbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BsYXllcicsICcuL2Fzc2V0cy9hdGxhc2VzL3BsYXllci5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2d1bicsICcuL2Fzc2V0cy9hdGxhc2VzL2d1bi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2J1bGxldCcsICcuL2Fzc2V0cy9hdGxhc2VzL2J1bGxldC5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BlY2hlbicsICcuL2Fzc2V0cy9hdGxhc2VzL3BlY2hlbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3NlcmRlY2hrbycsICcuL2Fzc2V0cy9hdGxhc2VzL3NlcmRlY2hrby5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3poZWx1ZG9rJywgJy4vYXNzZXRzL2F0bGFzZXMvemhlbHVkb2sucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtb3pnJywgJy4vYXNzZXRzL2F0bGFzZXMvbW96Zy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2RlbW9uJywgJy4vYXNzZXRzL2F0bGFzZXMvZGVtb24ucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCd6b21iaScsICcuL2Fzc2V0cy9hdGxhc2VzL3pvbWJpLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnY2hpcmlwYWtoYScsICcuL2Fzc2V0cy9hdGxhc2VzL2NoaXJpcGFraGEucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdnbHV6JywgJy4vYXNzZXRzL2F0bGFzZXMvZ2x1ei5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2RlYXRoJywgJy4vYXNzZXRzL2F0bGFzZXMvZGVhdGgucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pbW96ZycsICcuL2Fzc2V0cy9hdGxhc2VzL21pbmltb3pnLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbWluaXBhbHlhJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaXBhbHlhLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbWluaXphbWJpJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaXphbWJpLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbmV4dExvYycsICcuL2Fzc2V0cy9hdGxhc2VzL25leHRMb2MucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdzY3JlZW4nLCAnLi9hc3NldHMvYXRsYXNlcy9zY3JlZW4ucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdwYXRyeScsICcuL2Fzc2V0cy9hdGxhc2VzL3BhdHJ5LnBuZycpO1xuXG5cdFx0dGhpcy5sb2FkLmltYWdlKCd0YWJsaWNoa2ExJywgJy4vYXNzZXRzL2F0bGFzZXMvdGFibGljaGthMS5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3RhYmxpY2hrYTInLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2EyLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnbmV3TG9jJywgJy4vYXNzZXRzL2F0bGFzZXMvdGFibGljaGthMy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3RhYmxpY2hrYTQnLCAnLi9hc3NldHMvYXRsYXNlcy90YWJsaWNoa2E0LnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgndGFibGljaGthNScsICcuL2Fzc2V0cy9hdGxhc2VzL3RhYmxpY2hrYTUucG5nJyk7XG5cblx0XHR0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ3N0YXJ0JywgJy4vYXNzZXRzL2F0bGFzZXMvc3RhcnQucG5nJywgNTAsIDE4KTtcblx0XHR0aGlzLmxvYWQuc3ByaXRlc2hlZXQoJ3BheScsICcuL2Fzc2V0cy9hdGxhc2VzL3BheS5wbmcnLCA1MCwgMTgpO1xuXHR9XG5cblx0Y3JlYXRlKCkge1xuXHRcdHRoaXMuc3RhdGUuc3RhcnQoJ0hvbWUnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByZWxvYWQ7XG4iXX0=
