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
