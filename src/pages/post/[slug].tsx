import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router'

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
  uid: string;
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {
  const router = useRouter();

  const postContent = post.data.content.map(content => {
    return {
      heading: content.heading,
      body: RichText.asHtml(content.body)
    }
  })

  const wordsInPost = post.data.content.reduce((acc, el) => {
    let wordsBody = el.body.map(content => (
      content.text.split(' ')
    ))
    let wordsHeading = el.heading.split(' ')
    wordsBody.forEach(words => acc += Number(words.length))
    acc += Number(wordsHeading.length)
    return acc
  }, 0) 

  const timeToRead = Math.ceil(wordsInPost / 200)

  if(router.isFallback) {
    return (
      <p>Carregando...</p>
    )
  }
  
  return (
    <>
      <div className={styles.postContainer}>
        <img src={post.data.banner.url} alt="" />
        <div className={styles.post} >
          <h1 className={commonStyles.title}>{post.data.title}</h1>
          <div className={styles.postContent}>
            <span className={commonStyles.publicationInformation}>
              <FiCalendar />
              {format(
                new Date(post.first_publication_date),
                "dd MMM yyyy",
                {
                  locale: ptBR,
                }
              )}
            </span>
            <span className={commonStyles.publicationInformation}>
              <FiUser />
              {post.data.author}
            </span>
            <span className={commonStyles.publicationInformation}>
              <FiClock />
              {timeToRead} min
            </span>
          </div>
          {postContent.map(content => (
            <>
              <h2>{content.heading}</h2>
              <div 
                className={styles.postText} 
                dangerouslySetInnerHTML={{ __html: content.body }} 
              />
            </>
          ))}
        </div>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 100
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });
    

  return {
    paths,
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({params}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  return {
    props: {
      post: {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
          title: response.data.title,
          subtitle: response.data.subtitle,
          banner: {
            url: response.data.banner.url,
          },
          author: response.data.author,
          content: response.data.content,
        },
      }
    }
  }
}