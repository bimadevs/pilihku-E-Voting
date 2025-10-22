'use client'

import { motion } from 'framer-motion'
import { FaLock, FaUserCheck, FaCheckDouble, FaRocket } from 'react-icons/fa'
import { StepItem } from './types'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stepsData: StepItem[] = [
  {
    step: "1",
    title: "Login",
    desc: "Masuk menggunakan NIS yang telah terdaftar di sistem",
    icon: <FaLock className="w-6 h-6 text-white" />,
    color: "from-indigo-500 via-blue-500 to-cyan-500"
  },
  {
    step: "2",
    title: "Pilih Kandidat",
    desc: "Pelajari profil setiap kandidat dengan seksama",
    icon: <FaUserCheck className="w-6 h-6 text-white" />,
    color: "from-purple-500 via-pink-500 to-rose-500"
  },
  {
    step: "3",
    title: "Konfirmasi",
    desc: "Pastikan pilihanmu sudah sesuai sebelum submit",
    icon: <FaCheckDouble className="w-6 h-6 text-white" />,
    color: "from-emerald-500 via-green-500 to-teal-500"
  },
  {
    step: "4",
    title: "Selesai",
    desc: "Suaramu telah tersimpan dengan aman di sistem",
    icon: <FaRocket className="w-6 h-6 text-white" />,
    color: "from-orange-500 via-red-500 to-pink-500"
  }
]

export default function StepsSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/20"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="text-center mb-16"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-white/20 to-white/5 backdrop-blur-sm rounded-2xl mb-6 border border-white/20"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaRocket className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Cara Voting
          </h2>
          <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
            Ikuti langkah-langkah mudah berikut untuk memberikan suaramu dengan aman dan terpercaya
          </p>
        </motion.div>

        {/* Vertical Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400"></div>

          <div className="space-y-12">
            {stepsData.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-6"
              >
                {/* Timeline Node */}
                <motion.div
                  className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center shadow-lg border-4 border-white/20`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-xl font-bold text-white">{item.step}</span>
                </motion.div>

                {/* Content Card */}
                <motion.div
                  className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
                  whileHover={{ x: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-gradient-to-r ${item.color} rounded-lg`}>
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-indigo-100 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Sistem voting tersedia 24/7</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
