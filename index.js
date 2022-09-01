const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
let scoreEl = document.querySelector('#scoreEl')

canvas.width = innerWidth
canvas.height = innerHeight

// 玩家飞机
class Player {
  constructor() {
    // 移动速度
    this.velocity = {
      x: 0, y: 0
    }
    this.opacity = 1
    // 移动的时候飞机倾斜角度
    this.rotation = 0
    const image = new Image()
    image.src = './img/spaceship.png'
    image.onload = () => {
      this.scale = 0.15
      this.image = image
      this.width = image.width * this.scale
      this.height = image.height * this.scale
      this.position = {
        x: canvas.width / 2 - this.width / 2, y: canvas.height - this.height - 20
      }
    }

  }

  draw() {
    c.save()
    // 中心点
    c.globalAlpha = this.opacity
    c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2)
    c.rotate(this.rotation)
    c.translate(-this.position.x - this.width / 2, -this.position.y - this.height / 2)
    c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
    c.restore()
  }

  update() {
    if (this.image) {
      this.draw()
      this.position.x += this.velocity.x
    }
  }

}

// 玩家飞机子弹
class Projectile {
  constructor({position, velocity}) {
    this.position = position
    this.velocity = velocity

    // 子弹半径
    this.radius = 3
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = 'red'
    c.fill()
    c.closePath()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

class Particle {
  constructor({position, velocity, radius, color, fades}) {
    this.position = position // 坐标
    this.velocity = velocity // 坐标移动速度（每帧移动多少）

    // 子弹半径
    this.radius = radius
    // 颜色
    this.color = color
    this.opacity = 1
    this.fades = fades
  }

  draw() {
    c.save()
    c.beginPath()
    c.globalAlpha = this.opacity
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = this.color
    c.fill()
    c.closePath()
    c.restore()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    if (this.fades) {
      this.opacity -= 0.01
    }
  }
}

// 敌人子弹
class InvaderProjectile {
  constructor({position, velocity}) {
    this.position = position
    this.velocity = velocity
    this.width = 3
    this.height = 20

  }

  draw() {
    c.fillStyle = 'white'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
    // c.closePath()
  }

  update() {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

// 敌人
class Invader {
  constructor({position}) {
    // 移动速度
    this.velocity = {
      x: 0, y: 0
    }
    const image = new Image()
    image.src = './img/invader.png'
    image.onload = () => {
      this.scale = 1
      this.image = image
      this.width = image.width * this.scale
      this.height = image.height * this.scale
      this.position = {
        x: position.x, y: position.y
      }
    }
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height)
  }

  update({velocity}) {
    if (this.image) {
      this.draw()
      this.position.x += velocity.x
      this.position.y += velocity.y
    }
  }

  shoot(invaderProjectiles) {
    invaderProjectiles.push(new InvaderProjectile({
      position: {
        x: this.position.x + this.width / 2, y: this.position.y + this.height
      }, velocity: {
        x: 0, y: 3
      }
    }))
  }
}

// 敌人阵型（格子）
class Grid {
  constructor() {
    this.position = {
      x: 0, y: 0
    }

    this.velocity = {
      x: 1, y: 0
    }
    this.invaders = []
    let clos = Math.floor(Math.random() * 10 + 5)
    let rows = Math.floor(Math.random() * 5 + 2)
    this.width = clos * 30
    // 创建invader，存入invaders
    for (let x = 0; x < clos; x++) {
      for (let y = 0; y < rows; y++) {
        this.invaders.push(new Invader({
          position: {
            x: x * 30, y: y * 30
          }
        }))
      }
    }
  }

  update() {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
    // 给invader传递0 +=也就是0
    this.velocity.y = 0

    // 到达两端反弹 所有invader.position.y += velocity.y
    if (this.position.x + this.width >= canvas.width || this.position.x < 0) {
      this.velocity.x = -this.velocity.x
      // invader.position.y += velocity.y
      this.velocity.y = 30
    }
  }
}

const player = new Player()
const projectiles = []
const grids = []
const invaderProjectiles = []
const particles = []

const keys = {
  a: {
    pressed: false
  }, d: {
    pressed: false
  }
}
let frames = 0
let randomInterval = Math.floor((Math.random() * 1500) + 1000)
let game = {
  over : false,
  active: true
}
let score = 0

function animate() {
  if (!game.active) return
  // 一直调用
  requestAnimationFrame(animate)
  // 画布背景填充
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  // 更新坐标
  player.update()
  particles.forEach((particle, i) => {
    if (particle.position.y >= canvas.height) {
      particle.position.x = Math.random() * canvas.width
      particle.position.y = particle.radius
    }
    if (particle.opacity <= 0) {
      particles.splice(i, 1)
    } else {
      particle.update()
    }
  })
  // 敌人的子弹
  invaderProjectiles.forEach((invaderProjectile, i) => {
    // 检测子弹是否飞出窗口
    if (invaderProjectile.position.y + invaderProjectile.height > canvas.height) {
      invaderProjectiles.splice(i, 1)
    } else {
      invaderProjectile.update()
    }
    // 子弹是否打到我方飞机
    if (invaderProjectile.position.y + invaderProjectile.height >= player.position.y
      && invaderProjectile.position.y + invaderProjectile.height <= player.position.y + player.height
      && invaderProjectile.position.x + invaderProjectile.width >= player.position.x
      && invaderProjectile.position.x <= player.position.x + player.width
    ) {
      // 敌人的子弹击中我方飞机时 移除子弹
      setTimeout(() => {
        invaderProjectiles.splice(i, 1)
        player.opacity = 0
        game.over = true
      },0)
      setTimeout(() => {
        game.active = false
      },2000)
      createParticles({
        object: player,
        color: '#ff4d1d',
        fades: true
      })
    }
  })
  // 如果子弹已经离开屏幕视野，那么删除他
  projectiles.forEach((projectile, index) => {
    if (projectile.position.y < 0) {
      projectiles.splice(index, 1)
    } else {
      projectile.update()
    }
  })

  // grid = 存放invader，用grid.update()来操控invader的走向
  grids.forEach((grid, gridIndex) => {
    grid.update()

    // 敌人随机生成子弹
    if (frames % 500 === 0 && grid.invaders.length > 0) {
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles)
    }
    grid.invaders.forEach((invader, i) => {
      invader.update({velocity: grid.velocity})
      // console.log(projectiles)
      projectiles.forEach((projectile, j) => {
        // 子弹与敌机碰撞检测
        if (projectile.position.y - projectile.radius <= invader.position.y + invader.height
          && projectile.position.x + projectile.radius >= invader.position.x
          && projectile.position.x - projectile.radius <= invader.position.x + invader.width
          && projectile.position.y + projectile.radius >= invader.position.y
        ) {
          setTimeout(() => {
            const invaderFind = grid.invaders.find(invader2 => invader2 === invader)
            const projectileFind = projectiles.find(projectile2 => projectile2 === projectile)
            if (invaderFind && projectileFind) {
              score += 100
              scoreEl.innerHTML = score
              // 敌机消失后生成碎片
              createParticles({object: invader,fades: true})
              // 删除子弹与敌机
              grid.invaders.splice(i, 1)
              projectiles.splice(j, 1)
              // 更新gird宽度，以免撞墙后宽度判断失败
              if (grid.invaders.length > 0) {
                const firstInvader = grid.invaders[0]
                const lastInvader = grid.invaders[grid.invaders.length - 1]
                // 最后一个的x-第一个的x+宽度
                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width
                grid.position.x = firstInvader.position.x
              } else {
                grids.splice(gridIndex, 1)
              }
            }
          }, 0)
        }
      })
    })
  })
  // 按键按下移动距离和不能超越屏幕
  if (keys.a.pressed && player.position.x >= 0) {
    player.velocity.x = -4
    player.rotation = -0.3
  } else if (keys.d.pressed && player.position.x <= canvas.width - player.width) {
    player.velocity.x = 4
    player.rotation = 0.3
  } else {
    player.velocity.x = 0
    player.rotation = 0
  }

  // randomInterval： 随机数
  // 每randomInterval帧就new一个Grid网格，（外星军团）
  if (frames % randomInterval === 0) {
    grids.push(new Grid())
    randomInterval = Math.floor((Math.random() * 700) + 700)
    frames = 0
  }
  // 每帧加一
  frames++
}

animate()
for (let k = 0; k < 100; k++) {
  particles.push(new Particle({
    position: {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height
    },
    velocity: {
      x: 0,
      y: 0.2
    },
    radius: Math.random() * 3,
    color: 'white',
    fades: false
  }))
}
function createParticles({object, color, fades}) {
  for (let k = 0; k < 15; k++) {
    particles.push(new Particle({
      position: {
        x: object.position.x + object.width / 2,
        y: object.position.y + object.height / 2
      },
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      },
      radius: Math.random() * 3,
      color: color || '#8867b6',
      fades: fades
    }))
  }
}

// 键盘按下和松开的监听
addEventListener('keydown', ({key}) => {
  if (game.over) return
  switch (key) {
    case ' ':
      projectiles.push(new Projectile({
        position: {
          x: player.position.x + player.width / 2, y: player.position.y
        }, velocity: {
          x: 0, y: -4
        }
      }))
      break
    case 'a':
      keys.a.pressed = true
      break
    case 'd':
      keys.d.pressed = true
      break

    default :
      break
  }
})

addEventListener('keyup', ({key}) => {
  switch (key) {
    case ' ':
      break
    case 'a':
      keys.a.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break

    default :
      break
  }
})