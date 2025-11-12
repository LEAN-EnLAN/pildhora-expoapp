import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.darkExamples}>
      <div className={styles.frame}>
        <div className={styles.contents}>
          <div className={styles.aSeparator} />
          <p className={styles.value}>Value</p>
        </div>
        <div className={styles.contents2}>
          <div className={styles.aSeparator} />
          <div className={styles.text}>
            <div className={styles.cursorAndValue}>
              <p className={styles.value2}>Value</p>
              <div className={styles.cursor} />
            </div>
            <p className={styles.clear}>􀁡</p>
          </div>
        </div>
        <div className={styles.contents3}>
          <div className={styles.aSeparator} />
          <p className={styles.value3}>Value</p>
        </div>
      </div>
      <div className={styles.mode}>
        <img src="../image/mhvf5284-hnnuua1.svg" className={styles.union} />
        <p className={styles.dark}>Dark</p>
      </div>
    </div>
  );
}

export default Component;
