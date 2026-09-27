import { Link } from 'react-router-dom'


function Home() {
  return (
    <section className="home-page">
      <h1>Rezervační systém</h1>
      <p>Jednoduché místo pro správu rezervací.</p>
      <Link className="button button--primary" to="/reservations">Vytvořit rezervaci</Link>
    </section>
  )
}

export default Home