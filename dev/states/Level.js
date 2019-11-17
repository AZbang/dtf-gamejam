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
