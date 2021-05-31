import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi'
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect, useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(postsPagination.results)
    setNextPage(postsPagination.next_page)
  }, [])

  function loadMorePosts() {
    fetch(postsPagination.next_page)
      .then(response => response.json())
      // .then(data => console.log(data))
      .then(data => {
        setPosts([ 
          ...posts,
          ...data.results
        ])
        setNextPage(data.next_page)
      })
  }
  
  return(
    <>
      <Head>
        <title>Início | spacetraveling</title>
      </Head>
      <main className={styles.contentContainer}>
        {posts.map(post => (
          <Link key={post.uid} href={`post/${post.uid}`}>
            <a>
              <div className={styles.postContainer}>
                <h1 className={commonStyles.title}>{post.data.title}</h1>
                <h2 className={commonStyles.subtitle}>{post.data.subtitle}</h2>
                <div className={styles.postContent}>
                  <span className={commonStyles.publicationInformation}>
                    <FiCalendar />
                    {format(new Date(post.first_publication_date),
                      "dd MMM yyyy",
                      {
                        locale: ptBR,
                      })
                    }
                  </span>
                  <span className={commonStyles.publicationInformation}>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </div>
            </a>
          </Link>
        ))}
        {nextPage ? (<button className={styles.loadMoreButton} onClick={() => loadMorePosts()}>Carregar mais posts</button>) : ('')}
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1
  });


  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    },
    revalidate: 60 * 30 // 30 minutes
  }
};
