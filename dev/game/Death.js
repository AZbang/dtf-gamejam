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
