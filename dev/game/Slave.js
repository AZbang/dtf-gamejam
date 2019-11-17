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
