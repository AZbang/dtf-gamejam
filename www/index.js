(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
class Death {
	constructor(level, x, y, type = 'death') {
		this.hp = 1;
		this.level = level;
		this.sprite = this.level.add.sprite(x, y, 'demon');

		this.sprite.anchor.set(1, 0.5);
		this.sprite.smoothed = false;
		this.sprite.class = this;
		this.level.physics.arcade.enable(this.sprite);
		this.sprite.body.gravity.y = 1000;

		this.text = this.level.add.text(0, 20, 'Надоел этот гадюшник?\nПриведи мне 10 душ\nИ я отправлю тебя в рай!', {
			fontSize: 10,
			fill: '#fff'
		});
		this.text.alpha = 0;
		this.sprite.addChild(this.text);
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		// drops organs...
	}

	update() {
		this.level.physics.arcade.collide(this.sprite, this.level.solids);

		this.text.alpha = 0;
		this.level.physics.arcade.overlap(this.sprite, this.level.player.sprite, (_, pl) => {
			this.text.alpha = 1;
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
		if (rightTile) this.dir = -1;
		if (leftTile) this.dir = 1;
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
				this.dead(bullet.rotation);
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
	constructor(level, x, y, type = 'enemy') {
		super(level, x, y, type);
		this.start = [x, y];
		this.attackMode = true;
		this.timer = 0;
	}

	onDead(rotation) {
		const { x, y } = this.sprite.position;
		this.level.dropOrgan(x, y, rotation);
		console.log('DEAD!');
		// drops organs...
	}

	targetEnemy(x, y) {
		const slaves = this.level.enemies.children.filter(e => e.class.type === 'slave' && !e.class.isDead);
		const slave = slaves[Math.floor(Math.random() * slaves.length)];
		this.track = slave ? slave.sprite : this.level.player.sprite;
	}

	update() {
		if (!this.track || this.track.class.isDead) return this.targetEnemy();
		if (this.level.game.math.distance(this.track.x, this.track.y, this.sprite.x, this.sprite.y) > 500) {
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
			100
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
		"weapon": "gun"
	},
	"slave": {
		"texture": "zombi",
		"jump": 3,
		"speed": 100,
		"weapon": ""
	},
	"enemy": {
		"texture": "demon",
		"jump": 3,
		"speed": 100,
		"radiusVisibility": 150,
		"weapon": ""
	},
	"fly": {
		"texture": "chiripakha",
		"jump": 3,
		"speed": 100,
		"radiusVisibility": 150,
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
	var game = new Phaser.Game(480, 320, Phaser.AUTO, 'ShooterBlink');

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
		this.h = 320;
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

		const news = ['ЧЕМПИОНАТ ДОКА 2! СОБИРАЙТЕ КОМАНДУ!', 'Хакатон от DTF! Собирайте команду!'];
		const text = news[Math.floor(Math.random() * news.length)];
		UI.addText(110, 80, text, 'Arial', 14).anchor.set(0, 0);

		UI.addText(140, 120, 'Магазин', 'Arial', 14);

		UI.addText(110, 140, '2 патроны = 1 орган', 'Arial', 14).anchor.set(0, 0);
		UI.addTextButton(300, 140, 'Обменять', 'Arial', 14, () => {
			if (!UI.organs) return;
			UI.organs -= 1;
			UI.bullets += 2;
		}).anchor.set(0, 0);

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

		UI.addTextButton(300, 220, 'НАЧАТЬ >', 'Arial', 14, () => {
			this.state.start('Level');
		}).anchor.set(0, 0);

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
		// САМАЯ ТУПАЯ ГЕНЕРАЦИЯ
		let lvl = Math.floor(Math.random() * 2) + 1;
		if (UI.isDead) {
			lvl = 'home';
		} else {
			while (lvl === UI.lastLvl) {
				lvl = Math.floor(Math.random() * 2) + 1;
			}
		}
		UI.lastLvl = lvl;
		lvl = UI.isDead ? lvl : 'level' + lvl;
		UI.isDead = false;

		this.map = this.game.add.tilemap(lvl, 16, 16);
		this.map.addTilesetImage('tilemap');
		this.map.debugMap = true;

		// FUCKING PHASER! I HATE U BITCH
		this.game.add.sprite(0, 0, 'bg').fixedToCamera = true;
		this.game.add.sprite(224, 0, 'bg').fixedToCamera = true;
		this.game.add.sprite(224 * 2, 0, 'bg').fixedToCamera = true;

		this.world.setBounds(0, 0, 224, 100 * 16);

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
				const args = [spawn.x + spawn.width / 2, spawn.y + spawn.height / 2, spawn.type];
				if (spawn.type === 'player') {
					this.player = new Player(this, ...args);
					this.mainHero = this.player.sprite;
					this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
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
				} else {
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
			this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
			this.mainHero.isMainHero = true;
			return;
		}

		this.mainHero.isMainHero = false;
		this.mainHero.body.velocity.y = 0;
		if (!notSwap) this.isPlayerMain = !this.isPlayerMain;
		this.mainHero = this.isPlayerMain ? this.player.sprite : slave;
		this.camera.follow(this.mainHero, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
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
		this.load.tilemap('home', './assets/levels/home.json', null, Phaser.Tilemap.TILED_JSON);

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
		this.load.spritesheet('fire_blue', './assets/atlases/fire_blue.png', 16, 16, 4);
		this.load.image('minimozg', './assets/atlases/minimozg.png');
		this.load.image('minipalya', './assets/atlases/minipalya.png');
		this.load.image('minizambi', './assets/atlases/minizambi.png');
	}

	create() {
		this.state.start('Home');
	}
}

module.exports = Preload;

},{"../mixins/UI.js":12}]},{},[11])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0RlYXRoLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VuZW15LmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0VudGl0eS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9GaXJlLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL0ZseS5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvZ2FtZS9QbGF5ZXIuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvU2xhdmUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvV2VhcG9uLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9nYW1lL2VudGl0aWVzLmpzb24iLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L2dhbWUvd2VhcG9ucy5qc29uIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9pbmRleC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvbWl4aW5zL1VJLmpzIiwiL2hvbWUvYXpiYW5nL2R0Zi1nYW1lL2Rldi9zdGF0ZXMvQm9vdC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL0hvbWUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9MZXZlbC5qcyIsIi9ob21lL2F6YmFuZy9kdGYtZ2FtZS9kZXYvc3RhdGVzL01lbnUuanMiLCIvaG9tZS9hemJhbmcvZHRmLWdhbWUvZGV2L3N0YXRlcy9QcmVsb2FkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNsYXNzIERlYXRoIHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUgPSAnZGVhdGgnKSB7XG5cdFx0dGhpcy5ocCA9IDE7XG5cdFx0dGhpcy5sZXZlbCA9IGxldmVsO1xuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKHgsIHksICdkZW1vbicpO1xuXG5cdFx0dGhpcy5zcHJpdGUuYW5jaG9yLnNldCgxLCAwLjUpO1xuXHRcdHRoaXMuc3ByaXRlLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUuY2xhc3MgPSB0aGlzO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMuc3ByaXRlKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LmdyYXZpdHkueSA9IDEwMDA7XG5cblx0XHR0aGlzLnRleHQgPSB0aGlzLmxldmVsLmFkZC50ZXh0KDAsIDIwLCAn0J3QsNC00L7QtdC7INGN0YLQvtGCINCz0LDQtNGO0YjQvdC40Lo/XFxu0J/RgNC40LLQtdC00Lgg0LzQvdC1IDEwINC00YPRiFxcbtCYINGPINC+0YLQv9GA0LDQstC70Y4g0YLQtdCx0Y8g0LIg0YDQsNC5IScsIHtcblx0XHRcdGZvbnRTaXplOiAxMCxcblx0XHRcdGZpbGw6ICcjZmZmJ1xuXHRcdH0pO1xuXHRcdHRoaXMudGV4dC5hbHBoYSA9IDA7XG5cdFx0dGhpcy5zcHJpdGUuYWRkQ2hpbGQodGhpcy50ZXh0KTtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0Ly8gZHJvcHMgb3JnYW5zLi4uXG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cblx0XHR0aGlzLnRleHQuYWxwaGEgPSAwO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHtcblx0XHRcdHRoaXMudGV4dC5hbHBoYSA9IDE7XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEZWF0aDtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4vRW50aXR5Jyk7XG5cbmNsYXNzIEVuZW15IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUgPSAnZW5lbXknKSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksIHR5cGUpO1xuXHRcdGlmICh0aGlzLndlYXBvbikgdGhpcy53ZWFwb24ud2VhcG9uLmZpcmVSYXRlID0gMzAwO1xuXHRcdHRoaXMuZGlyID0gMTtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0dGhpcy5sZXZlbC5kcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5zb2xpZHMpO1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5lbmVtaWVzLCAoXywgZW4pID0+IHtcblx0XHRcdGlmIChlbi5jbGFzcy50eXBlID09PSAnc2xhdmUnKSB7XG5cdFx0XHRcdGVuLmNsYXNzLmRlYWQoKTtcblx0XHRcdFx0dGhpcy5kZWFkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnBsYXllci5zcHJpdGUsIChfLCBwbCkgPT4gcGwuY2xhc3MuZGVhZCgpKTtcblxuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5sZXZlbC5tYWluSGVyby5wb3NpdGlvbjtcblx0XHRjb25zdCByaWdodFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54ICsgMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdGNvbnN0IGxlZnRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55KTtcblx0XHRpZiAocmlnaHRUaWxlKSB0aGlzLmRpciA9IC0xO1xuXHRcdGlmIChsZWZ0VGlsZSkgdGhpcy5kaXIgPSAxO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IDgwICogdGhpcy5kaXI7XG5cdFx0dGhpcy5zcHJpdGUuc2NhbGUueCA9IHRoaXMuZGlyICogLTE7XG5cblx0XHQvLyBlbHNlIHRoaXMuYm9keS52ZWxvY2l0eS54ID0gMDtcblxuXHRcdC8vIHRoaXMud2VhcG9uLnVwZGF0ZSh0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuYW5nbGVUb1hZKHRoaXMud2VhcG9uLnNwcml0ZSwgeCwgeSkpO1xuXG5cdFx0Ly8gaWYgKHRoaXMuZ2FtZS5tYXRoLmRpc3RhbmNlKHgsIHksIHRoaXMuc3ByaXRlLngsIHRoaXMuc3ByaXRlLnkpIDwgMTUwKSB7XG5cdFx0Ly8gXHQhdGhpcy5pc0RlYWQgJiYgdGhpcy53ZWFwb24uZmlyZSgpO1xuXHRcdC8vIH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVuZW15O1xuIiwiY29uc3QgV2VhcG9uID0gcmVxdWlyZSgnLi9XZWFwb24uanMnKTtcbmNvbnN0IGVudGl0aWVzID0gcmVxdWlyZSgnLi9lbnRpdGllcy5qc29uJyk7XG5cbmNsYXNzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5LCB0eXBlLCBpc1dlYXBvbiA9IHRydWUpIHtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMubGV2ZWwgPSBsZXZlbDtcblx0XHR0aGlzLmdhbWUgPSBsZXZlbC5nYW1lO1xuXHRcdHRoaXMuX2VudGl0eSA9IGVudGl0aWVzW3R5cGVdO1xuXG5cdFx0dGhpcy54ID0geCB8fCAwO1xuXHRcdHRoaXMueSA9IHkgfHwgMDtcblx0XHR0aGlzLnNwZWVkID0gdGhpcy5fZW50aXR5LnNwZWVkIHx8IDEwMDtcblx0XHR0aGlzLnJhZGl1c1Zpc2liaWxpdHkgPSAxMDA7XG5cdFx0dGhpcy5pc0p1bXBpbmcgPSBmYWxzZTtcblx0XHR0aGlzLmlzRGVhZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy53ZWFwb25JZCA9IHRoaXMuX2VudGl0eS53ZWFwb24gIT0gbnVsbCA/IHRoaXMuX2VudGl0eS53ZWFwb24gOiAnZ3VuJztcblx0XHR0aGlzLl9jcmVhdGVQaGFzZXJPYmplY3RzKCk7XG5cdH1cblxuXHRfY3JlYXRlUGhhc2VyT2JqZWN0cygpIHtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh0aGlzLngsIHRoaXMueSwgdGhpcy5fZW50aXR5LnRleHR1cmUpO1xuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblxuXHRcdGlmICh0aGlzLl9lbnRpdHkud2VhcG9uKSB0aGlzLndlYXBvbiA9IG5ldyBXZWFwb24odGhpcywgdGhpcy53ZWFwb25JZCk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5ncmF2aXR5LnkgPSAxMDAwO1xuXHRcdHRoaXMuc3ByaXRlLmJvZHkuZHJhZy5zZXQoMTUwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5Lm1heFZlbG9jaXR5LnNldCgxMDAwKTtcblx0XHR0aGlzLnNwcml0ZS5ib2R5LndpZHRoID0gMTY7XG5cdFx0dGhpcy5zcHJpdGUuYm9keS5oZWlnaHQgPSAxNjtcblx0XHR0aGlzLnNwcml0ZS5zeW5jQm91bmRzID0gdHJ1ZTtcblx0fVxuXG5cdF91cGRhdGUoKSB7XG5cdFx0aWYgKHRoaXMuaXNEZWFkKSByZXR1cm47XG5cblx0XHQvLyBjb2xsaXNpb24gcGVyc29uIHdpdGggYnVsbGV0c1xuXHRcdGxldCBidWxsZXRzID0gdGhpcy5sZXZlbC5idWxsZXRzLmNoaWxkcmVuO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgYnVsbGV0cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09IGJ1bGxldHNbaV0udHlwZU93bmVyIHx8XG5cdFx0XHRcdCh0aGlzLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTbGF2ZScgJiYgYnVsbGV0c1tpXS50eXBlT3duZXIgPT09ICdQbGF5ZXInKVxuXHRcdFx0KVxuXHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKGJ1bGxldHNbaV0sIHRoaXMuc3ByaXRlLCAocGVyc29uLCBidWxsZXQpID0+IHtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ICs9IE1hdGguY29zKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnkgKz0gTWF0aC5zaW4odGhpcy5zcHJpdGUucm90YXRpb24pICogMTA7XG5cdFx0XHRcdHRoaXMuZGVhZChidWxsZXQucm90YXRpb24pO1xuXHRcdFx0XHRidWxsZXQua2lsbCgpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gZXh0ZW5kcyB1cGRhdGUhXG5cdFx0dGhpcy51cGRhdGUgJiYgdGhpcy51cGRhdGUoKTtcblx0fVxuXG5cdGRlYWQocm90YXRpb24pIHtcblx0XHR0aGlzLmlzRGVhZCA9IHRydWU7XG5cdFx0dGhpcy5vbkRlYWQgJiYgdGhpcy5vbkRlYWQocm90YXRpb24pO1xuXHRcdHRoaXMuc3ByaXRlLmtpbGwoKTtcblx0XHRpZiAodGhpcy53ZWFwb24pIHtcblx0XHRcdHRoaXMud2VhcG9uLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR0aGlzLndlYXBvbi53ZWFwb24uZGVzdHJveSgpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVudGl0eTtcbiIsImNsYXNzIEZpcmUge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgdHlwZSA9ICdmaXJlJykge1xuXHRcdHRoaXMuaHAgPSAxO1xuXHRcdHRoaXMubGV2ZWwgPSBsZXZlbDtcblx0XHR0aGlzLnNwcml0ZSA9IHRoaXMubGV2ZWwuYWRkLnNwcml0ZSh4LCB5LCAnZmlyZV9ibHVlJywgMSk7XG5cdFx0Y29uc3QgYW5pbSA9IHRoaXMuc3ByaXRlLmFuaW1hdGlvbnMuYWRkKCdkZWZhdWx0Jyk7XG5cdFx0YW5pbS5wbGF5KDEwLCB0cnVlKTtcblxuXHRcdHRoaXMuc3ByaXRlLmFuY2hvci5zZXQoMSwgMC41KTtcblx0XHR0aGlzLnNwcml0ZS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuc3ByaXRlLmNsYXNzID0gdGhpcztcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzLnNwcml0ZSk7XG5cdH1cblxuXHRvbkRlYWQocm90YXRpb24pIHtcblx0XHRjb25zdCB7IHgsIHkgfSA9IHRoaXMuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlLCAoXywgcGwpID0+IHBsLmNsYXNzLmRlYWQoKSk7XG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLmVuZW1pZXMsIChfLCBlbikgPT4ge1xuXHRcdFx0aWYgKGVuLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScpIHtcblx0XHRcdFx0ZW4uY2xhc3MuZGVhZCgpO1xuXHRcdFx0XHR0aGlzLnNwcml0ZS5raWxsKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaXJlO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcblxuY2xhc3MgRmx5IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IobGV2ZWwsIHgsIHksIHR5cGUgPSAnZW5lbXknKSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksIHR5cGUpO1xuXHRcdHRoaXMuc3RhcnQgPSBbeCwgeV07XG5cdFx0dGhpcy5hdHRhY2tNb2RlID0gdHJ1ZTtcblx0XHR0aGlzLnRpbWVyID0gMDtcblx0fVxuXG5cdG9uRGVhZChyb3RhdGlvbikge1xuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5zcHJpdGUucG9zaXRpb247XG5cdFx0dGhpcy5sZXZlbC5kcm9wT3JnYW4oeCwgeSwgcm90YXRpb24pO1xuXHRcdGNvbnNvbGUubG9nKCdERUFEIScpO1xuXHRcdC8vIGRyb3BzIG9yZ2Fucy4uLlxuXHR9XG5cblx0dGFyZ2V0RW5lbXkoeCwgeSkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMubGV2ZWwuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRjb25zdCBzbGF2ZSA9IHNsYXZlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzbGF2ZXMubGVuZ3RoKV07XG5cdFx0dGhpcy50cmFjayA9IHNsYXZlID8gc2xhdmUuc3ByaXRlIDogdGhpcy5sZXZlbC5wbGF5ZXIuc3ByaXRlO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdGlmICghdGhpcy50cmFjayB8fCB0aGlzLnRyYWNrLmNsYXNzLmlzRGVhZCkgcmV0dXJuIHRoaXMudGFyZ2V0RW5lbXkoKTtcblx0XHRpZiAodGhpcy5sZXZlbC5nYW1lLm1hdGguZGlzdGFuY2UodGhpcy50cmFjay54LCB0aGlzLnRyYWNrLnksIHRoaXMuc3ByaXRlLngsIHRoaXMuc3ByaXRlLnkpID4gNTAwKSB7XG5cdFx0XHR0aGlzLnNwcml0ZS5wb3NpdGlvbi54ID0gdGhpcy5zdGFydFswXTtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnkgPSB0aGlzLnN0YXJ0WzFdO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRpbWVyID4gMTAwKSB7XG5cdFx0XHR0aGlzLnRpbWVyID0gMDtcblx0XHRcdHRoaXMuYXR0YWNrTW9kZSA9IHRydWU7XG5cdFx0fSBlbHNlIHRoaXMudGltZXIrKztcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5lbmVtaWVzLCAoXywgZW4pID0+IHtcblx0XHRcdGlmIChlbi5jbGFzcy50eXBlID09PSAnc2xhdmUnKSB7XG5cdFx0XHRcdGVuLmNsYXNzLmRlYWQoKTtcblx0XHRcdFx0dGhpcy5hdHRhY2tNb2RlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKF8sIHBsKSA9PiBwbC5jbGFzcy5kZWFkKCkpO1xuXHRcdGNvbnN0IGFuZ2xlID0gdGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5tb3ZlVG9YWShcblx0XHRcdHRoaXMuc3ByaXRlLFxuXHRcdFx0dGhpcy50cmFjay54LFxuXHRcdFx0dGhpcy50cmFjay55IC0gKHRoaXMuYXR0YWNrTW9kZSA/IDAgOiAxMjApLFxuXHRcdFx0MTAwXG5cdFx0KTtcblxuXHRcdC8vIGJ1bGxldHNcblx0XHRsZXQgYnVsbGV0cyA9IHRoaXMubGV2ZWwuYnVsbGV0cy5jaGlsZHJlbjtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJ1bGxldHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5jb25zdHJ1Y3Rvci5uYW1lID09PSBidWxsZXRzW2ldLnR5cGVPd25lciB8fFxuXHRcdFx0XHQodGhpcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2xhdmUnICYmIGJ1bGxldHNbaV0udHlwZU93bmVyID09PSAnUGxheWVyJylcblx0XHRcdClcblx0XHRcdFx0Y29udGludWU7XG5cblx0XHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChidWxsZXRzW2ldLCB0aGlzLnNwcml0ZSwgKHBlcnNvbiwgYnVsbGV0KSA9PiB7XG5cdFx0XHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCArPSBNYXRoLmNvcyh0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDtcblx0XHRcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ICs9IE1hdGguc2luKHRoaXMuc3ByaXRlLnJvdGF0aW9uKSAqIDEwO1xuXHRcdFx0XHR0aGlzLmRlYWQoYnVsbGV0LnJvdGF0aW9uKTtcblx0XHRcdFx0YnVsbGV0LmtpbGwoKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSk7XG5cdFx0Ly8gY29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpO1xuXHRcdC8vIGlmIChyaWdodFRpbGUpIHRoaXMuZGlyID0gLTE7XG5cdFx0Ly8gaWYgKGxlZnRUaWxlKSB0aGlzLmRpciA9IDE7XG5cdFx0Ly8gdGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gODAgKiB0aGlzLmRpcjtcblx0XHQvLyB0aGlzLnNwcml0ZS5zY2FsZS54ID0gdGhpcy5kaXIgKiAtMTtcblxuXHRcdC8vIGVsc2UgdGhpcy5ib2R5LnZlbG9jaXR5LnggPSAwO1xuXG5cdFx0Ly8gdGhpcy53ZWFwb24udXBkYXRlKHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5hbmdsZVRvWFkodGhpcy53ZWFwb24uc3ByaXRlLCB4LCB5KSk7XG5cblx0XHQvLyBpZiAodGhpcy5nYW1lLm1hdGguZGlzdGFuY2UoeCwgeSwgdGhpcy5zcHJpdGUueCwgdGhpcy5zcHJpdGUueSkgPCAxNTApIHtcblx0XHQvLyBcdCF0aGlzLmlzRGVhZCAmJiB0aGlzLndlYXBvbi5maXJlKCk7XG5cdFx0Ly8gfVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmx5O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHkuanMnKTtcbmNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNsYXNzIFBsYXllciBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKGxldmVsLCB4LCB5KSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksICdwbGF5ZXInKTtcblx0XHR0aGlzLm9yZ2FucyA9IFtdO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnNwcml0ZSwgdGhpcy5sZXZlbC5zb2xpZHMpO1xuXG5cdFx0dGhpcy5zcHJpdGUuc2NhbGUueCA9IHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA8IDAgPyAtMSA6IDE7XG5cdFx0Y29uc3QgYW5nbGUgPSB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuYW5nbGVUb1BvaW50ZXIodGhpcy53ZWFwb24uc3ByaXRlKTtcblx0XHRpZiAoYW5nbGUgPCAtMS44IHx8IGFuZ2xlID4gMS40KSB0aGlzLnNwcml0ZS5zY2FsZS54ID0gLTE7XG5cdFx0ZWxzZSB0aGlzLnNwcml0ZS5zY2FsZS54ID0gMTtcblxuXHRcdHRoaXMud2VhcG9uLnVwZGF0ZShhbmdsZSk7XG5cblx0XHQvLyBJdGVtcyB1c2Vcblx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwuaXRlbXMsIChzcHJpdGUsIGl0ZW0pID0+IHtcblx0XHRcdGl0ZW0ua2lsbCgpO1xuXHRcdFx0dGhpcy5vcmdhbnMucHVzaChpdGVtLnR5cGUpO1xuXHRcdFx0VUkub3JnYW5zKys7XG5cdFx0XHR0aGlzLmxldmVsLmFkZFNsYXZlKHRoaXMuc3ByaXRlLnBvc2l0aW9uLngsIHRoaXMuc3ByaXRlLnBvc2l0aW9uLnkpO1xuXHRcdH0pO1xuXHR9XG5cblx0b25Xb3VuZGVkKCkge31cblxuXHRvbkRlYWQoKSB7XG5cdFx0VUkuaXNEZWFkID0gdHJ1ZTtcblx0XHR0aGlzLmxldmVsLnJlc3RydWN0U2xhdmVzKCk7XG5cdFx0dGhpcy5sZXZlbC5zdGF0ZS5zdGFydCgnSG9tZScpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHkuanMnKTtcblxuY2xhc3MgU2xhdmUgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3RvcihsZXZlbCwgeCwgeSwgaW5kZXgsIGxpbWl0KSB7XG5cdFx0c3VwZXIobGV2ZWwsIHgsIHksICdzbGF2ZScsIGZhbHNlKTtcblx0XHR0aGlzLmluZGV4ID0gaW5kZXg7XG5cdFx0dGhpcy5saW1pdCA9IGxpbWl0O1xuXHRcdHRoaXMuc3RvcE1vdmUgPSBmYWxzZTtcblx0XHR0aGlzLm5vdEFjdGl2ZSA9IGZhbHNlO1xuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdGlmICh0aGlzLnNwcml0ZS5pc01haW5IZXJvKSB0aGlzLm5vdEFjdGl2ZSA9IHRydWU7XG5cdFx0aWYgKHRoaXMubm90QWN0aXZlKSB7XG5cdFx0XHR0aGlzLmxldmVsLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy5zcHJpdGUsIHRoaXMubGV2ZWwucGxheWVyLnNwcml0ZSwgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm5vdEFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLmluZGV4ID0gdGhpcy5sZXZlbC5jb250cm9scy5sZW5ndGggLSB0aGlzLmxpbWl0O1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5sZXZlbC5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuc3ByaXRlLCB0aGlzLmxldmVsLnNvbGlkcyk7XG5cdFx0aWYgKHRoaXMubm90QWN0aXZlIHx8IHRoaXMuc3ByaXRlLmlzTWFpbkhlcm8gfHwgIXRoaXMubGV2ZWwuaXNQbGF5ZXJNYWluKSByZXR1cm47XG5cblx0XHQvLyBjb25zdCB7IHgsIHkgfSA9IHRoaXMubGV2ZWwubWFpbkhlcm8ucG9zaXRpb247XG5cdFx0Ly8gY29uc3QgdmVsWCA9IHRoaXMubGV2ZWwubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54O1xuXHRcdC8vaWYgKCF2ZWxYKSByZXR1cm47XG5cblx0XHRjb25zdCBbeCwgeSwgaXNHcm91ZF0gPSB0aGlzLmxldmVsLmNvbnRyb2xzW3RoaXMuaW5kZXhdO1xuXHRcdGlmICghdGhpcy5zdG9wTW92ZSkge1xuXHRcdFx0dGhpcy5zcHJpdGUuc2NhbGUueCA9IHggLSB0aGlzLnNwcml0ZS5wb3NpdGlvbi54IDwgMCA/IC0xIDogMTtcblx0XHRcdHRoaXMuc3ByaXRlLnBvc2l0aW9uLnggPSB4O1xuXHRcdFx0dGhpcy5zcHJpdGUucG9zaXRpb24ueSA9IHk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpc0dyb3VkIHx8IHRoaXMuaW5kZXggPCB0aGlzLmxldmVsLmNvbnRyb2xzLmxlbmd0aCAtIHRoaXMubGltaXQpIHtcblx0XHRcdGlmICh0aGlzLmluZGV4IDwgdGhpcy5sZXZlbC5jb250cm9scy5sZW5ndGggLSAxKSB7XG5cdFx0XHRcdHRoaXMuaW5kZXgrKztcblx0XHRcdFx0dGhpcy5zdG9wTW92ZSA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHRoaXMuc3RvcE1vdmUgPSB0cnVlO1xuXHRcdH0gZWxzZSB0aGlzLnN0b3BNb3ZlID0gdHJ1ZTtcblxuXHRcdC8vIGNvbnN0IHJpZ2h0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSkgfHwge307XG5cdFx0Ly8gY29uc3QgbGVmdFRpbGUgPSB0aGlzLmxldmVsLm1hcC5nZXRUaWxlV29ybGRYWSh0aGlzLnNwcml0ZS54IC0gMTYsIHRoaXMuc3ByaXRlLnkpIHx8IHt9O1xuXHRcdC8vIGNvbnN0IGRvd25MZWZ0VGlsZSA9IHRoaXMubGV2ZWwubWFwLmdldFRpbGVXb3JsZFhZKHRoaXMuc3ByaXRlLnggKyAxNiwgdGhpcy5zcHJpdGUueSArIDE2KTtcblx0XHQvLyBjb25zdCBkb3duUmlnaHRUaWxlID0gdGhpcy5sZXZlbC5tYXAuZ2V0VGlsZVdvcmxkWFkodGhpcy5zcHJpdGUueCAtIDE2LCB0aGlzLnNwcml0ZS55ICsgMTYpO1xuXG5cdFx0Ly8gaWYgKHRoaXMuc3ByaXRlLmJvZHkub25GbG9vcigpKSB7XG5cdFx0Ly8gXHRpZiAoIWRvd25MZWZ0VGlsZSB8fCBsZWZ0VGlsZS5jYW5Db2xsaWRlKSB7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG5cdFx0Ly8gXHRcdHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IC0xNTA7XG5cdFx0Ly8gXHR9XG5cdFx0Ly8gXHRpZiAoIWRvd25SaWdodFRpbGUgfHwgcmlnaHRUaWxlLmNhbkNvbGxpZGUpIHtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ID0gLTQwMDtcblx0XHQvLyBcdFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS54ID0gMTUwO1xuXHRcdC8vIFx0fVxuXHRcdC8vIH1cblxuXHRcdC8vIHRoaXMuc3ByaXRlLmJvZHkudmVsb2NpdHkueCA9IHZlbFg7XG5cblx0XHQvLyBpZiAodGhpcy5qdW1wQnV0dG9uLmlzRG93biAmJiB0aGlzLnNwcml0ZS5ib2R5Lm9uRmxvb3IoKSAmJiB0aGlzLmdhbWUudGltZS5ub3cgPiB0aGlzLmp1bXBUaW1lcikge1xuXHRcdC8vIFx0dGhpcy5zcHJpdGUuYm9keS52ZWxvY2l0eS55ID0gLTEwMDA7XG5cdFx0Ly8gXHR0aGlzLmp1bXBUaW1lciA9IHRoaXMuZ2FtZS50aW1lLm5vdyArIDUwMDtcblx0XHQvLyB9XG5cdH1cblxuXHRvbkRlYWQoKSB7XG5cdFx0aWYgKHRoaXMuc3ByaXRlLmlzTWFpbkhlcm8pIHRoaXMubGV2ZWwuc3dhcEhlcm8odHJ1ZSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTbGF2ZTtcbiIsImNvbnN0IHdlYXBvbnMgPSByZXF1aXJlKCcuL3dlYXBvbnMuanNvbicpO1xuXG5jbGFzcyBXZWFwb24ge1xuXHRjb25zdHJ1Y3RvcihwZXJzb24sIHR5cGUpIHtcblx0XHR0aGlzLmxldmVsID0gcGVyc29uLmxldmVsO1xuXHRcdHRoaXMuZ2FtZSA9IHRoaXMubGV2ZWwuZ2FtZTtcblx0XHR0aGlzLnBlcnNvbiA9IHBlcnNvbjtcblxuXHRcdHRoaXMuc3ByaXRlID0gdGhpcy5sZXZlbC5hZGQuc3ByaXRlKDAsIDAsICdndW4nKTtcblx0XHR0aGlzLnNwcml0ZS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0dGhpcy5zcHJpdGUuc21vb3RoZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMuX3dlYXBvbnMgPSB3ZWFwb25zW3R5cGVdO1xuXHRcdHRoaXMuaWQgPSB0aGlzLl93ZWFwb25zLmlkICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLmlkIDogMDtcblx0XHR0aGlzLnRyYWNrWCA9IHRoaXMuX3dlYXBvbnMudHJhY2tYICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLnRyYWNrWCA6IDE2O1xuXHRcdHRoaXMudHJhY2tZID0gdGhpcy5fd2VhcG9ucy50cmFja1kgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMudHJhY2tZIDogNDtcblx0XHR0aGlzLnNwZWVkID0gdGhpcy5fd2VhcG9ucy5zcGVlZCAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5zcGVlZCA6IDEwMDtcblx0XHR0aGlzLmRhbWFnZSA9IHRoaXMuX3dlYXBvbnMuZGFtYWdlICE9IG51bGwgPyB0aGlzLl93ZWFwb25zLmRhbWFnZSA6IDE7XG5cdFx0dGhpcy5kZWxheSA9IHRoaXMuX3dlYXBvbnMuZGVsYXkgIT0gbnVsbCA/IHRoaXMuX3dlYXBvbnMuZGVsYXkgOiAxMDtcblx0XHR0aGlzLnF1YW50aXR5ID0gdGhpcy5fd2VhcG9ucy5xdWFudGl0eSAhPSBudWxsID8gdGhpcy5fd2VhcG9ucy5xdWFudGl0eSA6IDE7XG5cblx0XHR0aGlzLndlYXBvbiA9IHRoaXMubGV2ZWwuYWRkLndlYXBvbigxMDAsICdidWxsZXQnLCBudWxsLCB0aGlzLmxldmVsLmJ1bGxldHMpO1xuXHRcdHRoaXMud2VhcG9uLnNldEJ1bGxldEZyYW1lcyh0aGlzLmlkLCB0aGlzLmlkLCB0cnVlKTtcblx0XHR0aGlzLndlYXBvbi5idWxsZXRLaWxsVHlwZSA9IFBoYXNlci5XZWFwb24uS0lMTF9XT1JMRF9CT1VORFM7XG5cdFx0dGhpcy53ZWFwb24uYnVsbGV0U3BlZWQgPSB0aGlzLnNwZWVkO1xuXHRcdHRoaXMud2VhcG9uLmZpcmVSYXRlID0gdGhpcy5kZWxheTtcblx0XHR0aGlzLndlYXBvbi5idWxsZXRzLnR5cGVPd25lciA9IHRoaXMucGVyc29uLmNvbnN0cnVjdG9yLm5hbWU7XG5cblx0XHR0aGlzLndlYXBvbi50cmFja1Nwcml0ZSh0aGlzLnBlcnNvbi5zcHJpdGUpO1xuXHR9XG5cblx0dXBkYXRlVHJhY2soeCwgeSkge1xuXHRcdHRoaXMuc3ByaXRlLmFuZ2xlID0gdGhpcy5sZXZlbC5nYW1lLmFuZ2xlQmV0d2Vlbih0aGlzLnNwcml0ZSk7XG5cdH1cblxuXHRmaXJlKHgsIHkpIHtcblx0XHRsZXQgYnVsbGV0ID0gdGhpcy53ZWFwb24uZmlyZSgpO1xuXHRcdHJldHVybiB0cnVlO1xuXHRcdC8vIGlmIChidWxsZXQpIHtcblx0XHQvLyBcdHRoaXMucGVyc29uLnNwcml0ZS5ib2R5LnZlbG9jaXR5LnggLT0gTWF0aC5jb3ModGhpcy5zcHJpdGUucm90YXRpb24pICogMTAwO1xuXHRcdC8vIFx0dGhpcy5wZXJzb24uc3ByaXRlLmJvZHkudmVsb2NpdHkueSAtPSBNYXRoLnNpbih0aGlzLnNwcml0ZS5yb3RhdGlvbikgKiAxMDA7XG5cdFx0Ly8gXHRyZXR1cm4gdHJ1ZTtcblx0XHQvLyB9XG5cdH1cblx0dXBkYXRlKGFuZ2xlKSB7XG5cdFx0Y29uc3QgeyB4LCB5IH0gPSB0aGlzLnBlcnNvbi5zcHJpdGUucG9zaXRpb247XG5cdFx0dGhpcy5zcHJpdGUucG9zaXRpb24uc2V0KHgsIHkgKyAzKTtcblx0XHR0aGlzLnNwcml0ZS5yb3RhdGlvbiA9IGFuZ2xlO1xuXHRcdHRoaXMud2VhcG9uLmZpcmVBbmdsZSA9IHRoaXMuZ2FtZS5tYXRoLnJhZFRvRGVnKGFuZ2xlKTtcblxuXHRcdHRoaXMubGV2ZWwucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLndlYXBvbi5idWxsZXRzLCB0aGlzLmxldmVsLnNvbGlkcywgKGJ1bGxldCwgdGlsZSkgPT4ge1xuXHRcdFx0YnVsbGV0LmtpbGwoKTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYXBvbjtcbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJwbGF5ZXJcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcInBsYXllclwiLFxuXHRcdFwianVtcFwiOiAzLFxuXHRcdFwic3BlZWRcIjogMTAwLFxuXHRcdFwid2VhcG9uXCI6IFwiZ3VuXCJcblx0fSxcblx0XCJzbGF2ZVwiOiB7XG5cdFx0XCJ0ZXh0dXJlXCI6IFwiem9tYmlcIixcblx0XHRcImp1bXBcIjogMyxcblx0XHRcInNwZWVkXCI6IDEwMCxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH0sXG5cdFwiZW5lbXlcIjoge1xuXHRcdFwidGV4dHVyZVwiOiBcImRlbW9uXCIsXG5cdFx0XCJqdW1wXCI6IDMsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJyYWRpdXNWaXNpYmlsaXR5XCI6IDE1MCxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH0sXG5cdFwiZmx5XCI6IHtcblx0XHRcInRleHR1cmVcIjogXCJjaGlyaXBha2hhXCIsXG5cdFx0XCJqdW1wXCI6IDMsXG5cdFx0XCJzcGVlZFwiOiAxMDAsXG5cdFx0XCJyYWRpdXNWaXNpYmlsaXR5XCI6IDE1MCxcblx0XHRcIndlYXBvblwiOiBcIlwiXG5cdH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJndW5cIjoge1xuXHRcdFwiaWRcIjogMSxcblx0XHRcInJhbmdlXCI6IDEwMCxcblx0XHRcInNwZWVkXCI6IDQwMCxcblx0XHRcImRhbWFnZVwiOiAxMCxcblx0XHRcImRlbGF5XCI6IDQwMCxcblx0XHRcInF1YW50aXR5XCI6IDEwLFxuXHRcdFwidHJhY2tYXCI6IDEsXG5cdFx0XCJ0cmFja1lcIjogMVxuXHR9XG59XG4iLCJjb25zdCBCb290ID0gcmVxdWlyZSgnLi9zdGF0ZXMvQm9vdC5qcycpO1xuY29uc3QgUHJlbG9hZCA9IHJlcXVpcmUoJy4vc3RhdGVzL1ByZWxvYWQuanMnKTtcbmNvbnN0IE1lbnUgPSByZXF1aXJlKCcuL3N0YXRlcy9NZW51LmpzJyk7XG5jb25zdCBMZXZlbCA9IHJlcXVpcmUoJy4vc3RhdGVzL0xldmVsLmpzJyk7XG5jb25zdCBIb21lID0gcmVxdWlyZSgnLi9zdGF0ZXMvSG9tZS5qcycpO1xuXG52YXIgcmVhZHkgPSAoKSA9PiB7XG5cdHZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDQ4MCwgMzIwLCBQaGFzZXIuQVVUTywgJ1Nob290ZXJCbGluaycpO1xuXG5cdGdhbWUuc3RhdGUuYWRkKCdNZW51JywgTWVudSk7XG5cdGdhbWUuc3RhdGUuYWRkKCdIb21lJywgSG9tZSk7XG5cdGdhbWUuc3RhdGUuYWRkKCdMZXZlbCcsIExldmVsKTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ1ByZWxvYWQnLCBQcmVsb2FkKTtcblx0Z2FtZS5zdGF0ZS5hZGQoJ0Jvb3QnLCBCb290LCB0cnVlKTtcbn07XG5cbnJlYWR5KCk7XG4iLCJ2YXIgVUkgPSB7XG5cdGxldmVsOiAxLFxuXHRidWxsZXRzOiAxMCxcblx0b3JnYW5zOiAwLFxuXHRpc0RlYWQ6IHRydWUsXG5cblx0YWRkVGV4dEJ1dHRvbjogKHggPSAwLCB5ID0gMCwgdGV4dCwgdGV4dEZhbWlseSwgZm9udFNpemUgPSAzMCwgY2IpID0+IHtcblx0XHRsZXQgdHh0ID0gVUkuYWRkVGV4dCh4LCB5LCB0ZXh0LCB0ZXh0RmFtaWx5LCBmb250U2l6ZSk7XG5cdFx0VUkuc2V0QnV0dG9uKHR4dCwgY2IpO1xuXHRcdHJldHVybiB0eHQ7XG5cdH0sXG5cblx0YWRkVGV4dDogKHggPSAwLCB5ID0gMCwgdGV4dCwgdGV4dEZhbWlseSwgZm9udFNpemUgPSAzMCwgZmlsbCA9ICcjZmZmJykgPT4ge1xuXHRcdGxldCB0eHQgPSBVSS5nYW1lLmFkZC50ZXh0KHgsIHksIHRleHQsIHsgdGV4dEZhbWlseSwgZm9udFNpemUsIGZpbGwgfSk7XG5cdFx0dHh0LnNtb290aGVkID0gZmFsc2U7XG5cdFx0dHh0LmFuY2hvci5zZXQoMC41KTtcblx0XHRyZXR1cm4gdHh0O1xuXHR9LFxuXG5cdGFkZEljb25CdXR0b246ICh4ID0gMCwgeSA9IDAsIGtleSwgaW5kZXgsIGNiKSA9PiB7XG5cdFx0bGV0IHNwcml0ZSA9IFVJLmdhbWUuYWRkLnNwcml0ZSh4LCB5LCBrZXksIGluZGV4KTtcblx0XHRzcHJpdGUuc21vb3RoZWQgPSBmYWxzZTtcblx0XHRzcHJpdGUuc2NhbGUuc2V0KDEuNSk7XG5cdFx0VUkuc2V0QnV0dG9uKHNwcml0ZSwgY2IpO1xuXHRcdHJldHVybiBzcHJpdGU7XG5cdH0sXG5cblx0c2V0QnV0dG9uOiAob2JqLCBjYikgPT4ge1xuXHRcdG9iai5pbnB1dEVuYWJsZWQgPSB0cnVlO1xuXHRcdGxldCB4ID0gb2JqLnNjYWxlLng7XG5cdFx0bGV0IHkgPSBvYmouc2NhbGUueTtcblxuXHRcdG9iai5ldmVudHMub25JbnB1dERvd24uYWRkKCgpID0+IHtcblx0XHRcdGlmIChvYmouZGlzYWJsZSkgcmV0dXJuO1xuXHRcdFx0VUkuZ2FtZS5hZGRcblx0XHRcdFx0LnR3ZWVuKG9iai5zY2FsZSlcblx0XHRcdFx0LnRvKHsgeDogeCArIDAuMywgeTogeSArIDAuMyB9LCAzMDApXG5cdFx0XHRcdC5zdGFydCgpO1xuXHRcdH0pO1xuXHRcdG9iai5ldmVudHMub25JbnB1dFVwLmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdGNiKCk7XG5cdFx0fSk7XG5cdFx0b2JqLmV2ZW50cy5vbklucHV0T3Zlci5hZGQoKCkgPT4ge1xuXHRcdFx0aWYgKG9iai5kaXNhYmxlKSByZXR1cm47XG5cdFx0XHRVSS5nYW1lLmFkZFxuXHRcdFx0XHQudHdlZW4ob2JqLnNjYWxlKVxuXHRcdFx0XHQudG8oeyB4OiB4ICsgMC4zLCB5OiB5ICsgMC4zIH0sIDMwMClcblx0XHRcdFx0LnN0YXJ0KCk7XG5cdFx0fSk7XG5cdFx0b2JqLmV2ZW50cy5vbklucHV0T3V0LmFkZCgoKSA9PiB7XG5cdFx0XHRpZiAob2JqLmRpc2FibGUpIHJldHVybjtcblx0XHRcdFVJLmdhbWUuYWRkXG5cdFx0XHRcdC50d2VlbihvYmouc2NhbGUpXG5cdFx0XHRcdC50byh7IHg6IHgsIHk6IHkgfSwgMzAwKVxuXHRcdFx0XHQuc3RhcnQoKTtcblx0XHR9KTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVSTtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNsYXNzIEJvb3Qge1xuXHRpbml0KCkge1xuXHRcdHRoaXMudyA9IDQ4MDtcblx0XHR0aGlzLmggPSAzMjA7XG5cdFx0VUkuZ2FtZSA9IHRoaXMuZ2FtZTtcblx0fVxuXG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLnNjYWxlLnNjYWxlTW9kZSA9IFBoYXNlci5TY2FsZU1hbmFnZXIuU0hPV19BTEw7XG5cdFx0dGhpcy5zY2FsZS5mdWxsU2NyZWVuU2NhbGVNb2RlID0gUGhhc2VyLlNjYWxlTWFuYWdlci5FWEFDVF9GSVQ7XG5cdFx0dGhpcy5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlO1xuXHRcdHRoaXMuc2NhbGUucGFnZUFsaWduVmVydGljYWxseSA9IHRydWU7XG5cdFx0dGhpcy5zY2FsZS5zZXRNYXhpbXVtKCk7XG5cblx0XHR0aGlzLmdhbWUucmVuZGVyZXIucmVuZGVyU2Vzc2lvbi5yb3VuZFBpeGVscyA9IHRydWU7XG5cdFx0UGhhc2VyLkNhbnZhcy5zZXRJbWFnZVJlbmRlcmluZ0NyaXNwKHRoaXMuZ2FtZS5jYW52YXMpO1xuXG5cdFx0dGhpcy5zdGF0ZS5zdGFydCgnUHJlbG9hZCcpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm9vdDtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJLmpzJyk7XG5cbmNvbnN0IExJVkVSID0gJ3BlY2hlbic7XG5jb25zdCBIRUFSVCA9ICdzZXJkZWNoa28nO1xuY29uc3QgU1RPTUFDSCA9ICd6aGVsdWRvayc7XG5jb25zdCBCUkFJTiA9ICdtb3pnJztcblxuY2xhc3MgSG9tZSB7XG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCA0ODAsIDMyMCk7XG5cblx0XHRjb25zdCBuZXdzID0gWyfQp9CV0JzQn9CY0J7QndCQ0KIg0JTQntCa0JAgMiEg0KHQntCR0JjQoNCQ0JnQotCVINCa0J7QnNCQ0J3QlNCjIScsICfQpdCw0LrQsNGC0L7QvSDQvtGCIERURiEg0KHQvtCx0LjRgNCw0LnRgtC1INC60L7QvNCw0L3QtNGDISddO1xuXHRcdGNvbnN0IHRleHQgPSBuZXdzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIG5ld3MubGVuZ3RoKV07XG5cdFx0VUkuYWRkVGV4dCgxMTAsIDgwLCB0ZXh0LCAnQXJpYWwnLCAxNCkuYW5jaG9yLnNldCgwLCAwKTtcblxuXHRcdFVJLmFkZFRleHQoMTQwLCAxMjAsICfQnNCw0LPQsNC30LjQvScsICdBcmlhbCcsIDE0KTtcblxuXHRcdFVJLmFkZFRleHQoMTEwLCAxNDAsICcyINC/0LDRgtGA0L7QvdGLID0gMSDQvtGA0LPQsNC9JywgJ0FyaWFsJywgMTQpLmFuY2hvci5zZXQoMCwgMCk7XG5cdFx0VUkuYWRkVGV4dEJ1dHRvbigzMDAsIDE0MCwgJ9Ce0LHQvNC10L3Rj9GC0YwnLCAnQXJpYWwnLCAxNCwgKCkgPT4ge1xuXHRcdFx0aWYgKCFVSS5vcmdhbnMpIHJldHVybjtcblx0XHRcdFVJLm9yZ2FucyAtPSAxO1xuXHRcdFx0VUkuYnVsbGV0cyArPSAyO1xuXHRcdH0pLmFuY2hvci5zZXQoMCwgMCk7XG5cblx0XHQvLyB0aGlzLmJnID0gdGhpcy5hZGQudGlsZVNwcml0ZSgwLCAwLCB0aGlzLndvcmxkLndpZHRoLCB0aGlzLndvcmxkLmhlaWdodCwgJ2JnJyk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGF0aDEgPSBVSS5hZGRUZXh0KDE2MCwgNTAsICdmb250JywgJ0JMSU5LJywgMzUpO1xuXHRcdC8vIHRoaXMuYWRkLnR3ZWVuKHRoaXMubGFiZWxQYXRoMSlcblx0XHQvLyBcdC50byh7YWxwaGE6IDB9LCAyMDApXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAxfSwgMTAwKVxuXHRcdC8vIFx0LnN0YXJ0KClcblx0XHQvLyBcdC5sb29wKCk7XG5cblx0XHQvLyB0aGlzLmxhYmVsUGFydDIgPSBVSS5hZGRUZXh0KDMyMCwgNTUsICdmb250JywgJ1NIT09URVInLCAyNSk7XG5cblx0XHQvLyB0aGlzLmJ0blN0YXJ0ID0gVUkuYWRkVGV4dEJ1dHRvbih0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWS0zNSwgJ2ZvbnQnLCAnU1RBUlQnLCAzMCwgKCkgPT4ge1xuXHRcdC8vIFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWxNYW5hZ2VyJyk7XG5cdFx0Ly8gfSk7XG5cdFx0Ly8gdGhpcy5idG5TZXR0aW5ncyA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclkrMTAsICdmb250JywgJ1NFVFRJTkdTJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ1NldHRpbmdzJyk7XG5cdFx0Ly8gfSk7XG5cblx0XHQvLyB0aGlzLmluZm8gPSBVSS5hZGRUZXh0KDEwLCA1LCAnZm9udDInLCAnUG93ZXJlZCBieSBhemJhbmcgQHYwLjEnLCAxNCk7XG5cdFx0Ly8gdGhpcy5pbmZvLmFuY2hvci5zZXQoMCk7XG5cblx0XHRVSS5hZGRUZXh0QnV0dG9uKDMwMCwgMjIwLCAn0J3QkNCn0JDQotCsID4nLCAnQXJpYWwnLCAxNCwgKCkgPT4ge1xuXHRcdFx0dGhpcy5zdGF0ZS5zdGFydCgnTGV2ZWwnKTtcblx0XHR9KS5hbmNob3Iuc2V0KDAsIDApO1xuXG5cdFx0bGV0IHN0YXJ0ID0gMjA7XG5cdFx0bGV0IHkgPSAyMTA7XG5cdFx0Y29uc3QgbWluaXBhbHlhID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgMzAsIHksICdtaW5pcGFseWEnKTtcblx0XHRtaW5pcGFseWEuc2NhbGUuc2V0KDIpO1xuXHRcdG1pbmlwYWx5YS5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaXBhbHlhLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmlwYWx5YS5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgMzQsIHkgKyAzLCBVSS5idWxsZXRzLCAnQXJpYWwnLCAxNCwgJyMwMCcpO1xuXHRcdHRoaXMuYnVsbGV0c1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cblx0XHRjb25zdCBtaW5pbW96ZyA9IHRoaXMuYWRkLnNwcml0ZShzdGFydCArIDkwLCB5LCAnbWluaW1vemcnKTtcblx0XHRtaW5pbW96Zy5zY2FsZS5zZXQoMik7XG5cdFx0bWluaW1vemcuYW5jaG9yLnNldCgwLjUpO1xuXHRcdG1pbmltb3pnLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdG1pbmltb3pnLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5vcmdhbnNUZXh0ID0gVUkuYWRkVGV4dChzdGFydCArIDk0LCB5ICsgMywgMCwgJ0FyaWFsJywgMTQsICcjZmYwMDAwJyk7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMub3JnYW5zVGV4dC5hbmNob3Iuc2V0KDAsIDAuNSk7XG5cdH1cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMuYnVsbGV0c1RleHQudGV4dCA9IFVJLmJ1bGxldHM7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LnRleHQgPSBVSS5vcmdhbnM7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb21lO1xuIiwiY29uc3QgUGxheWVyID0gcmVxdWlyZSgnLi4vZ2FtZS9QbGF5ZXInKTtcbmNvbnN0IEVuZW15ID0gcmVxdWlyZSgnLi4vZ2FtZS9FbmVteScpO1xuY29uc3QgU2xhdmUgPSByZXF1aXJlKCcuLi9nYW1lL1NsYXZlJyk7XG5jb25zdCBGaXJlID0gcmVxdWlyZSgnLi4vZ2FtZS9GaXJlJyk7XG5jb25zdCBGbHkgPSByZXF1aXJlKCcuLi9nYW1lL0ZseScpO1xuY29uc3QgRGVhdGggPSByZXF1aXJlKCcuLi9nYW1lL0RlYXRoJyk7XG5cbmNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJJyk7XG5cbmNvbnN0IExJVkVSID0gJ3BlY2hlbic7XG5jb25zdCBIRUFSVCA9ICdzZXJkZWNoa28nO1xuY29uc3QgU1RPTUFDSCA9ICd6aGVsdWRvayc7XG5jb25zdCBCUkFJTiA9ICdtb3pnJztcblxuY2xhc3MgTGV2ZWwge1xuXHRjcmVhdGUoKSB7XG5cdFx0Ly8g0KHQkNCc0JDQryDQotCj0J/QkNCvINCT0JXQndCV0KDQkNCm0JjQr1xuXHRcdGxldCBsdmwgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyKSArIDE7XG5cdFx0aWYgKFVJLmlzRGVhZCkge1xuXHRcdFx0bHZsID0gJ2hvbWUnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR3aGlsZSAobHZsID09PSBVSS5sYXN0THZsKSB7XG5cdFx0XHRcdGx2bCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIpICsgMTtcblx0XHRcdH1cblx0XHR9XG5cdFx0VUkubGFzdEx2bCA9IGx2bDtcblx0XHRsdmwgPSBVSS5pc0RlYWQgPyBsdmwgOiAnbGV2ZWwnICsgbHZsO1xuXHRcdFVJLmlzRGVhZCA9IGZhbHNlO1xuXG5cdFx0dGhpcy5tYXAgPSB0aGlzLmdhbWUuYWRkLnRpbGVtYXAobHZsLCAxNiwgMTYpO1xuXHRcdHRoaXMubWFwLmFkZFRpbGVzZXRJbWFnZSgndGlsZW1hcCcpO1xuXHRcdHRoaXMubWFwLmRlYnVnTWFwID0gdHJ1ZTtcblxuXHRcdC8vIEZVQ0tJTkcgUEhBU0VSISBJIEhBVEUgVSBCSVRDSFxuXHRcdHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdiZycpLmZpeGVkVG9DYW1lcmEgPSB0cnVlO1xuXHRcdHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDIyNCwgMCwgJ2JnJykuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5nYW1lLmFkZC5zcHJpdGUoMjI0ICogMiwgMCwgJ2JnJykuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCAyMjQsIDEwMCAqIDE2KTtcblxuXHRcdHRoaXMuc29saWRzID0gdGhpcy5tYXAuY3JlYXRlTGF5ZXIoJ3NvbGlkcycpO1xuXG5cdFx0dGhpcy5zb2xpZHMucmVzaXplV29ybGQoKTtcblx0XHR0aGlzLnNvbGlkcy5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdHRoaXMubWFwLnNldENvbGxpc2lvbkJldHdlZW4oMCwgMjcwLCB0aGlzLnNvbGlkcyk7XG5cblx0XHR0aGlzLmRlY29ycyA9IHRoaXMubWFwLmNyZWF0ZUxheWVyKCdkZWNvcicpO1xuXHRcdHRoaXMuZGVjb3JzLnJlc2l6ZVdvcmxkKCk7XG5cdFx0dGhpcy5kZWNvcnMuc21vb3RoZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMuZGVjb3JzMiA9IHRoaXMubWFwLmNyZWF0ZUxheWVyKCdkZWNvcjInKTtcblx0XHRpZiAodGhpcy5kZWNvcnMyKSB7XG5cdFx0XHR0aGlzLmRlY29yczIucmVzaXplV29ybGQoKTtcblx0XHRcdHRoaXMuZGVjb3JzMi5zbW9vdGhlZCA9IGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIFBhdGhGaW5kZXJzXG5cdFx0Ly9sZXQgYXJyID0gW107XG5cdFx0Ly9sZXQgcHJvcHMgPSB0aGlzLm1hcC50aWxlXHRzZXRzWzBdLnRpbGVQcm9wZXJ0aWVzO1xuXHRcdC8vZm9yIChsZXQgaSBpbiBwcm9wcykge1xuXHRcdC8vXHR0aGlzLm1hcC5zZXRDb2xsaXNpb24oK2ksIHRydWUsIHRoaXMuZmlyc3RMYXllck1hcCk7XG5cdFx0Ly99XG5cdFx0Ly90aGlzLnBhdGhmaW5kZXIgPSB0aGlzLmdhbWUucGx1Z2lucy5hZGQoUGhhc2VyLlBsdWdpbi5QYXRoRmluZGVyUGx1Z2luKTtcblx0XHQvL3RoaXMucGF0aGZpbmRlci5zZXRHcmlkKHRoaXMubWFwLmxheWVyc1swXS5kYXRhLCBhcnIpO1xuXG5cdFx0Ly8gZ3JvdXBcblx0XHR0aGlzLmJ1bGxldHMgPSB0aGlzLmFkZC5ncm91cCgpO1xuXHRcdHRoaXMuZW5lbWllcyA9IHRoaXMuZ2FtZS5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLml0ZW1zID0gdGhpcy5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLmVsZW1lbnRzID0gdGhpcy5hZGQuZ3JvdXAoKTtcblx0XHR0aGlzLml0ZW1zLmVuYWJsZUJvZHkgPSB0cnVlO1xuXG5cdFx0dGhpcy5zd2FwQnV0dG9uID0gdGhpcy5pbnB1dC5rZXlib2FyZC5hZGRLZXkoUGhhc2VyLktleWJvYXJkLlopO1xuXHRcdHRoaXMuanVtcEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5XKTtcblx0XHR0aGlzLmxlZnRCdXR0b24gPSB0aGlzLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuQSk7XG5cdFx0dGhpcy5yaWdodEJ1dHRvbiA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5EKTtcblx0XHR0aGlzLmlzUGxheWVyTWFpbiA9IHRydWU7XG5cblx0XHR0aGlzLmRpZmZTbGF2ZSA9IDE7XG5cdFx0dGhpcy5zbGF2ZUxlZnQgPSAwO1xuXHRcdHRoaXMuc2xhdmVSaWdodCA9IDA7XG5cblx0XHR0aGlzLmNvbnRyb2xzID0gW107XG5cblx0XHR0aGlzLnN3YXBCdXR0b24ub25VcC5hZGQoKCkgPT4gdGhpcy5zd2FwSGVybygpKTtcblx0XHR0aGlzLl9jcmVhdGVFbmVtaWVzKCk7XG5cblx0XHRsZXQgc3RhcnQgPSAyMDtcblx0XHRsZXQgeSA9IDIxMDtcblx0XHRjb25zdCBtaW5pcGFseWEgPSB0aGlzLmFkZC5zcHJpdGUoc3RhcnQgKyAzMCwgeSwgJ21pbmlwYWx5YScpO1xuXHRcdG1pbmlwYWx5YS5zY2FsZS5zZXQoMik7XG5cdFx0bWluaXBhbHlhLmFuY2hvci5zZXQoMC41KTtcblx0XHRtaW5pcGFseWEuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaXBhbHlhLnNtb290aGVkID0gZmFsc2U7XG5cdFx0dGhpcy5idWxsZXRzVGV4dCA9IFVJLmFkZFRleHQoc3RhcnQgKyAzNCwgeSArIDMsIFVJLmJ1bGxldHMsICdBcmlhbCcsIDE0LCAnIzAwJyk7XG5cdFx0dGhpcy5idWxsZXRzVGV4dC5maXhlZFRvQ2FtZXJhID0gdHJ1ZTtcblx0XHR0aGlzLmJ1bGxldHNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblxuXHRcdGNvbnN0IG1pbmltb3pnID0gdGhpcy5hZGQuc3ByaXRlKHN0YXJ0ICsgOTAsIHksICdtaW5pbW96ZycpO1xuXHRcdG1pbmltb3pnLnNjYWxlLnNldCgyKTtcblx0XHRtaW5pbW96Zy5hbmNob3Iuc2V0KDAuNSk7XG5cdFx0bWluaW1vemcuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0bWluaW1vemcuc21vb3RoZWQgPSBmYWxzZTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQgPSBVSS5hZGRUZXh0KHN0YXJ0ICsgOTQsIHkgKyAzLCAwLCAnQXJpYWwnLCAxNCwgJyNmZjAwMDAnKTtcblx0XHR0aGlzLm9yZ2Fuc1RleHQuZml4ZWRUb0NhbWVyYSA9IHRydWU7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LmFuY2hvci5zZXQoMCwgMC41KTtcblx0fVxuXHRfY3JlYXRlRW5lbWllcygpIHtcblx0XHR0aGlzLm1hcC5vYmplY3RzLnNwYXduICYmXG5cdFx0XHR0aGlzLm1hcC5vYmplY3RzLnNwYXduLmZvckVhY2goc3Bhd24gPT4ge1xuXHRcdFx0XHRjb25zdCBhcmdzID0gW3NwYXduLnggKyBzcGF3bi53aWR0aCAvIDIsIHNwYXduLnkgKyBzcGF3bi5oZWlnaHQgLyAyLCBzcGF3bi50eXBlXTtcblx0XHRcdFx0aWYgKHNwYXduLnR5cGUgPT09ICdwbGF5ZXInKSB7XG5cdFx0XHRcdFx0dGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMsIC4uLmFyZ3MpO1xuXHRcdFx0XHRcdHRoaXMubWFpbkhlcm8gPSB0aGlzLnBsYXllci5zcHJpdGU7XG5cdFx0XHRcdFx0dGhpcy5jYW1lcmEuZm9sbG93KHRoaXMubWFpbkhlcm8sIFBoYXNlci5DYW1lcmEuRk9MTE9XX0xPQ0tPTiwgMC4xLCAwLjEpO1xuXHRcdFx0XHRcdHRoaXMucGxheWVyLndlYXBvbi53ZWFwb24ub25GaXJlLmFkZCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRVSS5idWxsZXRzIC09IDE7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5jb250cm9scy5wdXNoKFthcmdzWzBdLCBhcmdzWzFdLCBmYWxzZV0pO1xuXHRcdFx0XHRcdHRoaXMuc3RydWN0U2xhdmVzKCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2ZpcmUnKSB7XG5cdFx0XHRcdFx0dGhpcy5lbGVtZW50cy5hZGQobmV3IEZpcmUodGhpcywgLi4uYXJncykuc3ByaXRlKTtcblx0XHRcdFx0fSBlbHNlIGlmIChzcGF3bi50eXBlID09PSAnZmluaXNoJykge1xuXHRcdFx0XHRcdHRoaXMuZmluaXNoID0gc3Bhd247XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2ZseScpIHtcblx0XHRcdFx0XHR0aGlzLmVsZW1lbnRzLmFkZChuZXcgRmx5KHRoaXMsIC4uLmFyZ3MpLnNwcml0ZSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoc3Bhd24udHlwZSA9PT0gJ2RlYXRoJykge1xuXHRcdFx0XHRcdHRoaXMuZWxlbWVudHMuYWRkKG5ldyBEZWF0aCh0aGlzLCAuLi5hcmdzKS5zcHJpdGUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxldCBlbmVteSA9IG5ldyBFbmVteSh0aGlzLCAuLi5hcmdzKTtcblx0XHRcdFx0XHR0aGlzLmVuZW1pZXMuYWRkKGVuZW15LnNwcml0ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9XG5cblx0c3dhcEhlcm8obm90U3dhcCkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRjb25zdCBzbGF2ZSA9IHNsYXZlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzbGF2ZXMubGVuZ3RoKV07XG5cdFx0aWYgKCFzbGF2ZSkge1xuXHRcdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gZmFsc2U7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IDA7XG5cdFx0XHR0aGlzLmlzUGxheWVyTWFpbiA9IHRydWU7XG5cdFx0XHR0aGlzLm1haW5IZXJvID0gdGhpcy5wbGF5ZXIuc3ByaXRlO1xuXHRcdFx0dGhpcy5jYW1lcmEuZm9sbG93KHRoaXMubWFpbkhlcm8sIFBoYXNlci5DYW1lcmEuRk9MTE9XX0xPQ0tPTiwgMC4xLCAwLjEpO1xuXHRcdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gdHJ1ZTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLm1haW5IZXJvLmlzTWFpbkhlcm8gPSBmYWxzZTtcblx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IDA7XG5cdFx0aWYgKCFub3RTd2FwKSB0aGlzLmlzUGxheWVyTWFpbiA9ICF0aGlzLmlzUGxheWVyTWFpbjtcblx0XHR0aGlzLm1haW5IZXJvID0gdGhpcy5pc1BsYXllck1haW4gPyB0aGlzLnBsYXllci5zcHJpdGUgOiBzbGF2ZTtcblx0XHR0aGlzLmNhbWVyYS5mb2xsb3codGhpcy5tYWluSGVybywgUGhhc2VyLkNhbWVyYS5GT0xMT1dfTE9DS09OLCAwLjEsIDAuMSk7XG5cdFx0dGhpcy5tYWluSGVyby5pc01haW5IZXJvID0gdHJ1ZTtcblx0fVxuXG5cdGRyb3BPcmdhbih4LCB5LCByb3RhdGlvbikge1xuXHRcdGNvbnN0IHR5cGVzID0gW0xJVkVSLCBIRUFSVCwgU1RPTUFDSCwgQlJBSU5dO1xuXHRcdGNvbnN0IHR5cGUgPSB0eXBlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiB0eXBlcy5sZW5ndGgpXTtcblx0XHRjb25zdCBvcmdhbiA9IHRoaXMuYWRkLnNwcml0ZSh4LCB5LCB0eXBlKTtcblx0XHR0aGlzLnBoeXNpY3MuYXJjYWRlLmVuYWJsZShvcmdhbik7XG5cblx0XHRvcmdhbi5ib2R5LmdyYXZpdHkueSA9IDEwMDA7XG5cdFx0b3JnYW4uYm9keS52ZWxvY2l0eS54IC09IHRoaXMucmFuZG9tKC0xMDAsIDEwMCk7XG5cdFx0b3JnYW4uYm9keS52ZWxvY2l0eS55IC09IHRoaXMucmFuZG9tKDEwLCAxMDApO1xuXHRcdG9yZ2FuLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMuaXRlbXMuYWRkKG9yZ2FuKTtcblx0fVxuXG5cdHJhbmRvbShtaW4sIG1heCkge1xuXHRcdHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyAtbWluO1xuXHR9XG5cblx0YWRkU2xhdmUoKSB7XG5cdFx0aWYgKFVJLm9yZ2FucyA8IDQpIHJldHVybjtcblx0XHRjb25zdCBzbGF2ZXMgPSB0aGlzLmVuZW1pZXMuY2hpbGRyZW4uZmlsdGVyKGUgPT4gZS5jbGFzcy50eXBlID09PSAnc2xhdmUnICYmICFlLmNsYXNzLmlzRGVhZCk7XG5cdFx0Y29uc3QgaW5kZXggPSBNYXRoLm1heCh0aGlzLmNvbnRyb2xzLmxlbmd0aCAtIDEwICogKHNsYXZlcy5sZW5ndGggKyAxKSwgMCk7XG5cdFx0Y29uc3QgW3gsIHldID0gdGhpcy5jb250cm9sc1tpbmRleF07XG5cdFx0bGV0IHNsYXZlID0gbmV3IFNsYXZlKHRoaXMsIHgsIHksIGluZGV4LCAxMCAqIChzbGF2ZXMubGVuZ3RoICsgMSkpO1xuXHRcdHRoaXMuZW5lbWllcy5hZGQoc2xhdmUuc3ByaXRlKTtcblx0XHRVSS5vcmdhbnMgLT0gNDtcblx0fVxuXG5cdHJlc3RydWN0U2xhdmVzKCkge1xuXHRcdGNvbnN0IHNsYXZlcyA9IHRoaXMuZW5lbWllcy5jaGlsZHJlbi5maWx0ZXIoZSA9PiBlLmNsYXNzLnR5cGUgPT09ICdzbGF2ZScgJiYgIWUuY2xhc3MuaXNEZWFkKTtcblx0XHRVSS5vcmdhbnMgKz0gc2xhdmVzLmxlbmd0aCAqIDQ7XG5cdH1cblxuXHRzdHJ1Y3RTbGF2ZXMoKSB7XG5cdFx0Y29uc3Qgc2xhdmVzID0gTWF0aC5mbG9vcihVSS5vcmdhbnMgLyA0KTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNsYXZlczsgaSsrKSB7XG5cdFx0XHR0aGlzLmFkZFNsYXZlKCk7XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlQ29udHJvbCgpIHtcblx0XHRpZiAodGhpcy5pc1BsYXllck1haW4gJiYgKHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS54IHx8IHRoaXMubWFpbkhlcm8uYm9keS52ZWxvY2l0eS55KSlcblx0XHRcdHRoaXMuY29udHJvbHMucHVzaChbdGhpcy5wbGF5ZXIuc3ByaXRlLngsIHRoaXMucGxheWVyLnNwcml0ZS55LCB0aGlzLm1haW5IZXJvLmJvZHkub25GbG9vcigpXSk7XG5cblx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueCA9IDA7XG5cblx0XHRpZiAodGhpcy5sZWZ0QnV0dG9uLmlzRG93bikge1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggPSAtMTUwO1xuXHRcdFx0dGhpcy5tYWluSGVyby5zY2FsZS54ID0gLTE7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnJpZ2h0QnV0dG9uLmlzRG93bikge1xuXHRcdFx0dGhpcy5tYWluSGVyby5ib2R5LnZlbG9jaXR5LnggPSAxNTA7XG5cdFx0XHR0aGlzLm1haW5IZXJvLnNjYWxlLnggPSAxO1xuXHRcdH1cblx0XHRpZiAodGhpcy5qdW1wQnV0dG9uLmlzRG93biAmJiB0aGlzLm1haW5IZXJvLmJvZHkub25GbG9vcigpKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmJvZHkudmVsb2NpdHkueSA9IC00MDA7XG5cdFx0fVxuXG5cdFx0aWYgKFVJLmJ1bGxldHMgJiYgdGhpcy5nYW1lLmlucHV0Lm1vdXNlUG9pbnRlci5pc0Rvd24gJiYgdGhpcy5pc1BsYXllck1haW4gJiYgIXRoaXMubWFpbkhlcm8uY2xhc3MuaXNEZWFkKSB7XG5cdFx0XHR0aGlzLm1haW5IZXJvLmNsYXNzLndlYXBvbi5maXJlKCk7XG5cdFx0fVxuXHR9XG5cblx0dXBkYXRlKCkge1xuXHRcdHRoaXMuYnVsbGV0c1RleHQudGV4dCA9IFVJLmJ1bGxldHM7XG5cdFx0dGhpcy5vcmdhbnNUZXh0LnRleHQgPSBVSS5vcmdhbnM7XG5cblx0XHR0aGlzLnBsYXllci5fdXBkYXRlKCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmVuZW1pZXMuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMuZW5lbWllcy5jaGlsZHJlbltpXS5jbGFzcy5fdXBkYXRlKCk7XG5cdFx0fVxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50cy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5lbGVtZW50cy5jaGlsZHJlbltpXS5jbGFzcy51cGRhdGUoKTtcblx0XHR9XG5cdFx0dGhpcy5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuaXRlbXMsIHRoaXMuc29saWRzLCBpdGVtID0+IChpdGVtLmJvZHkudmVsb2NpdHkueCA9IDApKTtcblx0XHR0aGlzLnVwZGF0ZUNvbnRyb2woKTtcblxuXHRcdGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5wbGF5ZXIuc3ByaXRlLnBvc2l0aW9uO1xuXHRcdGNvbnN0IHJlY3QgPSB0aGlzLmZpbmlzaDtcblx0XHRpZiAoeCA8IHJlY3QueCArIDE2ICYmIHggKyAxNiA+IHJlY3QueCAmJiB5IDwgcmVjdC55ICsgMTYgJiYgeSArIDE2ID4gcmVjdC55KSB7XG5cdFx0XHR0aGlzLnJlc3RydWN0U2xhdmVzKCk7XG5cdFx0XHR0aGlzLnN0YXRlLnJlc3RhcnQoJ0xldmVsJyk7XG5cdFx0fVxuXHRcdC8vdGhpcy5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMuZW5lbWllcywgdGhpcy5lbmVtaWVzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsO1xuIiwiY29uc3QgVUkgPSByZXF1aXJlKCcuLi9taXhpbnMvVUkuanMnKTtcblxuY2xhc3MgTWVudSB7XG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLndvcmxkLnNldEJvdW5kcygwLCAwLCA0ODAsIDMyMCk7XG5cdFx0Ly8gdGhpcy5iZyA9IHRoaXMuYWRkLnRpbGVTcHJpdGUoMCwgMCwgdGhpcy53b3JsZC53aWR0aCwgdGhpcy53b3JsZC5oZWlnaHQsICdiZycpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhdGgxID0gVUkuYWRkVGV4dCgxNjAsIDUwLCAnZm9udCcsICdCTElOSycsIDM1KTtcblx0XHQvLyB0aGlzLmFkZC50d2Vlbih0aGlzLmxhYmVsUGF0aDEpXG5cdFx0Ly8gXHQudG8oe2FscGhhOiAwfSwgMjAwKVxuXHRcdC8vIFx0LnRvKHthbHBoYTogMX0sIDEwMClcblx0XHQvLyBcdC5zdGFydCgpXG5cdFx0Ly8gXHQubG9vcCgpO1xuXG5cdFx0Ly8gdGhpcy5sYWJlbFBhcnQyID0gVUkuYWRkVGV4dCgzMjAsIDU1LCAnZm9udCcsICdTSE9PVEVSJywgMjUpO1xuXG5cdFx0Ly8gdGhpcy5idG5TdGFydCA9IFVJLmFkZFRleHRCdXR0b24odGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclktMzUsICdmb250JywgJ1NUQVJUJywgMzAsICgpID0+IHtcblx0XHQvLyBcdHRoaXMuc3RhdGUuc3RhcnQoJ0xldmVsTWFuYWdlcicpO1xuXHRcdC8vIH0pO1xuXHRcdC8vIHRoaXMuYnRuU2V0dGluZ3MgPSBVSS5hZGRUZXh0QnV0dG9uKHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZKzEwLCAnZm9udCcsICdTRVRUSU5HUycsIDMwLCAoKSA9PiB7XG5cdFx0Ly8gXHR0aGlzLnN0YXRlLnN0YXJ0KCdTZXR0aW5ncycpO1xuXHRcdC8vIH0pO1xuXG5cdFx0Ly8gdGhpcy5pbmZvID0gVUkuYWRkVGV4dCgxMCwgNSwgJ2ZvbnQyJywgJ1Bvd2VyZWQgYnkgYXpiYW5nIEB2MC4xJywgMTQpO1xuXHRcdC8vIHRoaXMuaW5mby5hbmNob3Iuc2V0KDApO1xuXHR9XG5cdHVwZGF0ZSgpIHt9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVudTtcbiIsImNvbnN0IFVJID0gcmVxdWlyZSgnLi4vbWl4aW5zL1VJLmpzJyk7XG5cbmNsYXNzIFByZWxvYWQge1xuXHRwcmVsb2FkKCkge1xuXHRcdC8vIE11c2ljXG5cdFx0Ly8gdGhpcy5sb2FkLmF1ZGlvKFwibXVzaWMxXCIsIFwiLi9hc3NldHMvbXVzaWMvdGhlbWUtMS5vZ2dcIik7XG5cblx0XHQvLyBJbWFnZXNcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJiZ1wiLCBcIi4vYXNzZXRzL2JnLnBuZ1wiKTtcblxuXHRcdC8vICBVSVxuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcImxpZmVib3hcIiwgXCIuL2Fzc2V0cy9VSS9saWZlYm94LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJsaWZlcmVjdFwiLCBcIi4vYXNzZXRzL1VJL2xpZmVyZWN0LnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJ3aW5kb3dcIiwgXCIuL2Fzc2V0cy9VSS93aW5kb3cucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcInZqb3lfYm9keVwiLCBcIi4vYXNzZXRzL1VJL2JvZHkucG5nXCIpO1xuXHRcdC8vIHRoaXMubG9hZC5pbWFnZShcInZqb3lfY2FwXCIsIFwiLi9hc3NldHMvVUkvYnV0dG9uLnBuZ1wiKTtcblx0XHQvLyB0aGlzLmxvYWQuaW1hZ2UoXCJidXR0b25KdW1wXCIsIFwiLi9hc3NldHMvVUkvYnV0dG9uSnVtcC5wbmdcIik7XG5cdFx0Ly8gdGhpcy5sb2FkLmltYWdlKFwiYnV0dG9uRmlyZVwiLCBcIi4vYXNzZXRzL1VJL2J1dHRvbkZpcmUucG5nXCIpO1xuXG5cdFx0Ly8gQW5pbWF0aW9uc1xuXHRcdC8vIHRoaXMubG9hZC5zcHJpdGVzaGVldChcImZ4X2ZpcmVcIiwgXCIuL2Fzc2V0cy9hbmltYXRpb25zL2ZpcmUucG5nXCIsIDMyLCAzMywgNik7XG5cblx0XHQvLyBHYW1lIEF0bGFzZXNcblx0XHQvLyB0aGlzLmxvYWQuYXRsYXMoXG5cdFx0Ly8gXHRcImFzc2V0cy9cIixcblx0XHQvLyBcdFwiYXNzZXRzL2F0bGFzZXMvaXRlbXMucG5nXCIsXG5cdFx0Ly8gXHRcImFzc2V0cy9hdGxhc2VzL2l0ZW1zLmpzb25cIixcblx0XHQvLyBcdFBoYXNlci5Mb2FkZXIuVEVYVFVSRV9BVExBU19KU09OX0hBU0hcblx0XHQvLyApO1xuXG5cdFx0Ly8gTGV2ZWxzXG5cdFx0dGhpcy5sb2FkLnRpbGVtYXAoJ2xldmVsMScsICcuL2Fzc2V0cy9sZXZlbHMvbGV2ZWwxLmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblx0XHR0aGlzLmxvYWQudGlsZW1hcCgnbGV2ZWwyJywgJy4vYXNzZXRzL2xldmVscy9sZXZlbDIuanNvbicsIG51bGwsIFBoYXNlci5UaWxlbWFwLlRJTEVEX0pTT04pO1xuXHRcdHRoaXMubG9hZC50aWxlbWFwKCdob21lJywgJy4vYXNzZXRzL2xldmVscy9ob21lLmpzb24nLCBudWxsLCBQaGFzZXIuVGlsZW1hcC5USUxFRF9KU09OKTtcblxuXHRcdHRoaXMubG9hZC5pbWFnZSgndGlsZW1hcCcsICcuL2Fzc2V0cy9hdGxhc2VzL3RpbGVtYXAucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdiZycsICcuL2Fzc2V0cy9hdGxhc2VzL2Zvbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BsYXllcicsICcuL2Fzc2V0cy9hdGxhc2VzL3BsYXllci5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2d1bicsICcuL2Fzc2V0cy9hdGxhc2VzL2d1bi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2J1bGxldCcsICcuL2Fzc2V0cy9hdGxhc2VzL2J1bGxldC5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3BlY2hlbicsICcuL2Fzc2V0cy9hdGxhc2VzL3BlY2hlbi5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3NlcmRlY2hrbycsICcuL2Fzc2V0cy9hdGxhc2VzL3NlcmRlY2hrby5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ3poZWx1ZG9rJywgJy4vYXNzZXRzL2F0bGFzZXMvemhlbHVkb2sucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtb3pnJywgJy4vYXNzZXRzL2F0bGFzZXMvbW96Zy5wbmcnKTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ2RlbW9uJywgJy4vYXNzZXRzL2F0bGFzZXMvZGVtb24ucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCd6b21iaScsICcuL2Fzc2V0cy9hdGxhc2VzL3pvbWJpLnBuZycpO1xuXHRcdHRoaXMubG9hZC5pbWFnZSgnY2hpcmlwYWtoYScsICcuL2Fzc2V0cy9hdGxhc2VzL2NoaXJpcGFraGEucG5nJyk7XG5cdFx0dGhpcy5sb2FkLnNwcml0ZXNoZWV0KCdmaXJlX2JsdWUnLCAnLi9hc3NldHMvYXRsYXNlcy9maXJlX2JsdWUucG5nJywgMTYsIDE2LCA0KTtcblx0XHR0aGlzLmxvYWQuaW1hZ2UoJ21pbmltb3pnJywgJy4vYXNzZXRzL2F0bGFzZXMvbWluaW1vemcucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pcGFseWEnLCAnLi9hc3NldHMvYXRsYXNlcy9taW5pcGFseWEucG5nJyk7XG5cdFx0dGhpcy5sb2FkLmltYWdlKCdtaW5pemFtYmknLCAnLi9hc3NldHMvYXRsYXNlcy9taW5pemFtYmkucG5nJyk7XG5cdH1cblxuXHRjcmVhdGUoKSB7XG5cdFx0dGhpcy5zdGF0ZS5zdGFydCgnSG9tZScpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlbG9hZDtcbiJdfQ==
