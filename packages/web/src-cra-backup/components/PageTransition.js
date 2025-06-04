import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ( { children } ) =>
{
    const pageVariants = {
        initial: {
            opacity: 0,
            x: -20,
            scale: 0.98,
        },
        animate: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        exit: {
            opacity: 0,
            x: 20,
            scale: 0.98,
            transition: {
                duration: 0.2,
                ease: [0.4, 0, 1, 1],
            },
        },
    };

    const contentVariants = {
        initial: {
            opacity: 0,
            y: 20,
        },
        animate: {
            opacity: 1,
            y: 0,
            transition: {
                delay: 0.1,
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
            },
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.2,
                ease: [0.4, 0, 1, 1],
            },
        },
    };

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={ pageVariants }
            className="w-full"
        >
            <motion.div variants={ contentVariants }>{ children }</motion.div>
        </motion.div>
    );
};

export default PageTransition; 