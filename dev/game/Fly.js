const Entity = require('./Entity');

class Fly extends Entity {
	constructor(level, x, y) {
		super(level, x, y, Math.random() < 0.5 ? 'gluz' : 'chiripakha');
		this.start = [x, y];
		this.attackMode = true;
		this.timer = 0;
		this.sprite.body.gravity.y = 0;
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
