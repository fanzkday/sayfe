type TExector<T, K> = (
  /**
   * 当前索引, 从1开始
   */
  index: number,
  /**
   * 提供的小工具
   */
  utils: {
    /**
     * 手动结束Try
     */
    stop: (info: K) => void;
    /**
     * 休眠函数
     */
    sleep: () => Promise<unknown>;
    /**
     * 上一次Exector的返回值
     */
    data: T;
  }
) => Promise<T>;

interface ITryer<T, K> {
  /**
   * 尝试次数
   */
  tries?: number;
  /**
   * 主执行器
   */
  exector: TExector<T, K>;
  /**
   * 执行结束的回调
   */
  finished?: (info: K) => Promise<any> | any;
}

type TTryer = <T, K>(args: ITryer<T, K>) => void | Promise<void>;

export const tryer: TTryer;
