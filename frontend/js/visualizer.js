/**
 * 命盘可视化组件
 * 使用Canvas绘制十二宫位图
 */

class PalaceVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.outerRadius = 200;
        this.innerRadius = 60;
        
        // 十二宫位名称（从命宫开始，逆时针）
        this.palaceNames = [
            '命宫', '父母宫', '福德宫', '田宅宫', '官禄宫', '交友宫',
            '迁移宫', '疾厄宫', '财帛宫', '子女宫', '夫妻宫', '兄弟宫'
        ];
        
        // 颜色配置
        this.colors = {
            background: 'rgba(255, 249, 238, 0.9)',
            border: '#c9a24a',
            text: '#1d2320',
            highlight: '#2a7d72',
            bodyPalace: '#b6452d'
        };
    }
    
    /**
     * 绘制命盘
     */
    draw(palacesData, bodyPalacePosition) {
        this.clear();
        this.drawBackground();
        this.drawPalaces(palacesData, bodyPalacePosition);
        this.drawCenter();
    }
    
    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 绘制背景
     */
    drawBackground() {
        // 绘制外圆
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 绘制内圆
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.innerRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(198, 95, 61, 0.15)';
        this.ctx.fill();
        this.ctx.strokeStyle = this.colors.border;
        this.ctx.stroke();
    }
    
    /**
     * 绘制十二宫位
     */
    drawPalaces(palacesData, bodyPalacePosition) {
        const angleStep = (Math.PI * 2) / 12;
        const startAngle = -Math.PI / 2; // 从顶部开始
        
        this.palaceNames.forEach((name, index) => {
            const angle = startAngle + angleStep * index;
            const nextAngle = angle + angleStep;
            
            // 检查是否为身宫
            const isBodyPalace = palacesData[name]?.isBodyPalace || false;
            
            // 绘制分隔线
            this.ctx.beginPath();
            this.ctx.moveTo(
                this.centerX + this.innerRadius * Math.cos(angle),
                this.centerY + this.innerRadius * Math.sin(angle)
            );
            this.ctx.lineTo(
                this.centerX + this.outerRadius * Math.cos(angle),
                this.centerY + this.outerRadius * Math.sin(angle)
            );
            this.ctx.strokeStyle = this.colors.border;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 绘制宫位名称
            const textAngle = angle + angleStep / 2;
            const textRadius = (this.outerRadius + this.innerRadius) / 2;
            const textX = this.centerX + textRadius * Math.cos(textAngle);
            const textY = this.centerY + textRadius * Math.sin(textAngle);
            
            this.ctx.save();
            this.ctx.translate(textX, textY);
            this.ctx.rotate(textAngle + Math.PI / 2);
            
            this.ctx.font = '600 13px "Noto Sans SC"';
            this.ctx.fillStyle = isBodyPalace ? this.colors.bodyPalace : this.colors.text;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(name, 0, 0);
            
            // 如果是身宫，添加标记
            if (isBodyPalace) {
                this.ctx.font = '10px "Noto Sans SC"';
                this.ctx.fillText('★', 0, -15);
            }
            
            this.ctx.restore();
            
            // 绘制主星信息（简化版）
            if (palacesData[name]?.mainStars?.length > 0) {
                const star = palacesData[name].mainStars[0];
                const starRadius = this.outerRadius - 25;
                const starX = this.centerX + starRadius * Math.cos(textAngle);
                const starY = this.centerY + starRadius * Math.sin(textAngle);
                
                this.ctx.font = '10px "Noto Sans SC"';
                this.ctx.fillStyle = this.colors.highlight;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(star.name, starX, starY);
            }
        });
    }
    
    /**
     * 绘制中心区域
     */
    drawCenter() {
        this.ctx.font = '700 16px "ZCOOL XiaoWei"';
        this.ctx.fillStyle = this.colors.border;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('紫微', this.centerX, this.centerY - 10);
        this.ctx.fillText('斗数', this.centerX, this.centerY + 10);
    }
}
