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
