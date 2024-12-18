import React, { useState } from 'react';

const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`Message: ${message}\n\nFrom: ${name} (${email})`);
    const mailtoLink = `mailto:uyyalanaveenedu@gmail.com?subject=${subject}&body=${body}`;

    try {
      window.location.href = mailtoLink;
    } catch (err) {
      window.open(mailtoLink);
    }
  };


  return (
    <div className='flex justify-center flex-col '>
    <form onSubmit={handleSubmit}
    className='border-[2px] border-gray-400 h-[600px] lg:w-[500px] rounded-lg justify-center flex flex-col items-center gap-[3rem] p-2 overflow-hidden'>
    <h1 className='text-3xl font-bold'>Contact me</h1>
    <div className='w-3/4 h-10 '>
    <label htmlFor="name" className='text-lg opacity-50 '>Name:</label>
    <input
    type="text"
    id="name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
    className='h-full w-full outline-none bg-transparent border-b-2 text-xl font-medium'
    />
    </div>
    <div className='w-3/4 h-10'>
    <label htmlFor="email" className='text-lg opacity-50'>Email:</label>
    <input
    type="email"
    id="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    className='h-full w-full outline-none bg-transparent border-b-2 text-xl font-medium'
    />
    </div>
    <div className='w-3/4 h-16 relative top-4'>
    <label htmlFor="message" className='text-lg opacity-50'>Message:</label>
    <textarea
    id="message"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    required
    rows={10}
    cols={30}
    className='h-full w-full  outline-none bg-transparent border-b-2 text-xl font-medium'
    />
    </div>
    <div className='w-full h-10 mt-16 flex justify-center'>
    <button type="submit" className='w-3/4 h-full bg-transparent border rounded-[4px] hover:bg-violet-700 hover:text-white text-xl font-medium border-gray-400'>Send</button>
    </div>

    </form>

    </div>
  );
};

export default ContactForm;