import React from 'react'
import ContactForm from '../../components/contact/ContactForm.jsx';


const Contact = () => {
  return (
    <div className='flex flex-col gap-16 items-center p-16 overflow-hidden bg-black'>
      <div className='flex items-center flex-col md:flex-row gap-10'>
        <h1 className='text-start lg:text-start font-acorn  md:text-7xl  text-7xl lg:text-[9rem] relative left-[-1rem]'>Lets work together</h1>
        <div className=''>
          <ContactForm />
        </div>
      </div>

      {/* <div className='social-links flex gap-16'>
        {socialLinks.map((linkData, index) => (
          <Link
            key={index}
            to={linkData.href}
            target="_blank"
          >
            <Icon as={linkData.icon} className='text-[2.6rem] hover:text-violet-700' />
          </Link>
        ))}
      </div> */}


    </div>
  )
}

export default Contact