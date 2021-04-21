
type TCalc = (expression: string) => {
  /**
   * 表达式计算求得的值
   */
  value: string;
  /**
   * 进一步格式化value值
   */
  format: ({
    /**
     * 保留的精度
     */
    precision: number,
    /**
     * 是否小数部分不足时补零
     */
    isPadZero: boolean }) => string;
}

export const calc: TCalc;